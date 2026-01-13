/**
 * Day 21 Report Service (Ticket 007)
 * Generates the Commitment Report for Day 21 Judgment Gate
 */

import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { calculateSmallWinsSummary, SmallWinsSummary, TIER_CONFIG } from '@/lib/metrics/small-wins';
import { scoreEvidencesForDay21, EvidenceScore } from '@/lib/openai/evidence-analysis';
import { Evidence, Vow, MeaningStatement, Memory } from '@/lib/supabase/types';

// ============================================
// Types
// ============================================

export interface Day21Report {
  metrics: {
    checkinRate: number;
    checkinCount: number;
    checkinTotal: number;
    ifThenRate: number;
    ifThenCount: number;
    evidenceRate: number;
    evidenceCount: number;
    commitmentRate: number;
    commitmentCompleted: number;
    commitmentTotal: number;
  };
  tier: 'on_track' | 'at_risk' | 'needs_reset';
  tierLabel: string;
  tierMessage: string;
  averageRate: number;
  resilienceCount: number;
  resilienceBreakdown: ResilienceBreakdown;
  evidenceHighlights: EvidenceHighlight[];
  vowEvolution: VowEvolution;
  potentialStatement: string;
  toughLovePreview: string;
}

export interface ResilienceBreakdown {
  ifThenExecutions: number;
  comebacks: number; // Days returned after gap
  persistenceInCheckins: number; // Times mentioned struggle but continued
}

export interface EvidenceHighlight {
  id: string;
  title: string;
  date: string;
  type: string;
  score: number;
  reason: string;
}

export interface VowEvolution {
  v1: {
    content: string;
    createdAt: string;
  } | null;
  v2: {
    content: string;
    createdAt: string;
  } | null;
  hasEvolved: boolean;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate resilience count - times user showed persistence
 */
async function calculateResilienceCount(
  supabase: SupabaseClient,
  userId: string
): Promise<{ count: number; breakdown: ResilienceBreakdown }> {
  // 1. Count If-Then executions
  const { data: ifThenData } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('if_then_triggered', true);

  const ifThenExecutions = ifThenData?.length || 0;

  // 2. Count comebacks (returned after 2+ day gap)
  const { data: checkins } = await supabase
    .from('checkins')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  let comebacks = 0;
  if (checkins && checkins.length > 1) {
    const dates = checkins.map(c => new Date(c.date));
    for (let i = 1; i < dates.length; i++) {
      const gap = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      if (gap >= 2) {
        comebacks++;
      }
    }
  }

  // 3. Count persistence mentions in checkins (struggle keywords followed by continuation)
  const { data: contentCheckins } = await supabase
    .from('checkins')
    .select('content')
    .eq('user_id', userId)
    .not('content', 'is', null);

  let persistenceInCheckins = 0;
  const struggleKeywords = ['辛い', 'きつい', '大変', '難しい', 'やめたい', '諦め', '挫折', '苦しい'];
  const persistKeywords = ['頑張', '続け', '乗り越え', '踏ん張', 'やる', '負けない'];

  if (contentCheckins) {
    for (const checkin of contentCheckins) {
      const content = checkin.content || '';
      const hasStruggle = struggleKeywords.some(k => content.includes(k));
      const hasPersist = persistKeywords.some(k => content.includes(k));
      if (hasStruggle && hasPersist) {
        persistenceInCheckins++;
      }
    }
  }

  const breakdown: ResilienceBreakdown = {
    ifThenExecutions,
    comebacks,
    persistenceInCheckins,
  };

  return {
    count: ifThenExecutions + comebacks + persistenceInCheckins,
    breakdown,
  };
}

/**
 * Get vow evolution (first version vs current version)
 */
async function getVowEvolution(
  supabase: SupabaseClient,
  userId: string
): Promise<VowEvolution> {
  // Get all vows ordered by version
  const { data: vows } = await supabase
    .from('vows')
    .select('content, version, created_at')
    .eq('user_id', userId)
    .order('version', { ascending: true });

  if (!vows || vows.length === 0) {
    return { v1: null, v2: null, hasEvolved: false };
  }

  const v1 = {
    content: vows[0].content,
    createdAt: vows[0].created_at,
  };

  const v2 = vows.length > 1
    ? {
        content: vows[vows.length - 1].content,
        createdAt: vows[vows.length - 1].created_at,
      }
    : null;

  return {
    v1,
    v2,
    hasEvolved: vows.length > 1 && v1.content !== v2?.content,
  };
}

/**
 * Generate AI Potential Statement
 */
async function generatePotentialStatement(
  openai: OpenAI,
  context: {
    vow: string;
    meaning: string;
    evidences: Evidence[];
    memories: Memory[];
    metrics: SmallWinsSummary;
  }
): Promise<string> {
  const prompt = `あなたはユーザーの21日間の行動を観察してきた「目撃者」です。
以下の情報から、このユーザーの「可能性」を1〜2文で述べてください。

## ユーザーの誓い
${context.vow || '(未設定)'}

## 意味づけ
${context.meaning || '(未設定)'}

## 行動継続スコア
- チェックイン継続率: ${Math.round(context.metrics.metrics.checkinRate * 100)}%
- コミット履行率: ${Math.round(context.metrics.metrics.commitmentRate * 100)}%
- ティア: ${TIER_CONFIG[context.metrics.tier].label}

## 主なエビデンス
${context.evidences.slice(0, 3).map(e => `- ${e.title} (${e.date})`).join('\n') || '(なし)'}

## 記憶されている変化
${context.memories.slice(0, 5).map(m => `- ${m.content}`).join('\n') || '(なし)'}

## 出力要件
- 「私はあなたに〜の可能性を見ています」という形式
- 具体的な観察に基づく根拠を含める
- 励ましではなく、事実に基づいた観察として述べる
- 日本語で1〜2文`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'あなたは目撃者（Witness）として、ユーザーの変化を観察し、その可能性を言語化します。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0].message.content || 'あなたの継続的な取り組みに、変化の兆しを見ています。';
  } catch (error) {
    console.error('Error generating potential statement:', error);
    return 'あなたの継続的な取り組みに、変化の兆しを見ています。';
  }
}

/**
 * Generate Tough Love Preview
 */
async function generateToughLovePreview(
  openai: OpenAI,
  context: {
    vow: string;
    metrics: SmallWinsSummary;
    memories: Memory[];
  }
): Promise<string> {
  const prompt = `あなたはユーザーの成長を支援するコーチです。
21日間の観察から、今後の「厳しい指摘」として伝えるべき課題を1つ特定してください。

## ユーザーの誓い
${context.vow || '(未設定)'}

## 行動データ
- チェックイン継続率: ${Math.round(context.metrics.metrics.checkinRate * 100)}%
- If-Then発動率: ${Math.round(context.metrics.metrics.ifThenRate * 100)}%
- Evidence提出率: ${Math.round(context.metrics.metrics.evidenceRate * 100)}%
- コミット履行率: ${Math.round(context.metrics.metrics.commitmentRate * 100)}%

## 観察された傾向（メモリより）
${context.memories.slice(0, 5).map(m => `- ${m.content}`).join('\n') || '(なし)'}

## 出力要件
- 「有料期間では、〜について厳しく指摘します」という形式
- 具体的な行動パターンや傾向を指摘
- 人格否定ではなく、行動への指摘
- 日本語で1〜2文`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'あなたは厳しくも温かいコーチとして、ユーザーの課題を率直に伝えます。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0].message.content || '有料期間では、言い訳パターンに気づいた際は率直に指摘します。';
  } catch (error) {
    console.error('Error generating tough love preview:', error);
    return '有料期間では、言い訳パターンに気づいた際は率直に指摘します。';
  }
}

// ============================================
// Main Report Generation
// ============================================

/**
 * Generate complete Day 21 report
 */
export async function generateDay21Report(
  supabase: SupabaseClient,
  userId: string,
  trialStartDate: string
): Promise<Day21Report> {
  // Initialize OpenAI client
  // Note: Using EXPO_PUBLIC_ for consistency with other services
  // Server-side should ideally use non-EXPO_PUBLIC env var
  const openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  });

  // Fetch all required data in parallel
  const [
    smallWinsSummary,
    resilienceData,
    vowEvolution,
    evidencesResult,
    vowResult,
    meaningResult,
    memoriesResult,
  ] = await Promise.all([
    calculateSmallWinsSummary(supabase, userId, trialStartDate),
    calculateResilienceCount(supabase, userId),
    getVowEvolution(supabase, userId),
    supabase.from('evidences').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('vows').select('content').eq('user_id', userId).eq('is_current', true).single(),
    supabase.from('meaning_statements').select('content').eq('user_id', userId).eq('is_current', true).single(),
    supabase.from('memories').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ]);

  const evidences: Evidence[] = evidencesResult.data || [];
  const vow = vowResult.data?.content || '';
  const meaning = meaningResult.data?.content || '';
  const memories: Memory[] = memoriesResult.data || [];

  // Score evidences and get highlights
  let evidenceHighlights: EvidenceHighlight[] = [];
  if (evidences.length > 0) {
    try {
      const analysisResult = await scoreEvidencesForDay21(evidences, vow, meaning);
      evidenceHighlights = analysisResult.highlights.map(h => {
        const evidence = evidences.find(e => e.id === h.evidence_id);
        return {
          id: h.evidence_id,
          title: evidence?.title || '',
          date: evidence?.date || '',
          type: evidence?.type || 'note',
          score: h.score,
          reason: h.reason,
        };
      });
    } catch (error) {
      console.error('Error scoring evidences:', error);
      // Fallback: use most recent evidences
      evidenceHighlights = evidences.slice(0, 3).map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        type: e.type,
        score: 0.5,
        reason: '最近のエビデンス',
      }));
    }
  }

  // Generate AI statements in parallel
  const [potentialStatement, toughLovePreview] = await Promise.all([
    generatePotentialStatement(openai, {
      vow,
      meaning,
      evidences,
      memories,
      metrics: smallWinsSummary,
    }),
    generateToughLovePreview(openai, {
      vow,
      metrics: smallWinsSummary,
      memories,
    }),
  ]);

  return {
    metrics: {
      checkinRate: smallWinsSummary.metrics.checkinRate,
      checkinCount: smallWinsSummary.metrics.checkinCount,
      checkinTotal: smallWinsSummary.metrics.checkinTotal,
      ifThenRate: smallWinsSummary.metrics.ifThenRate,
      ifThenCount: smallWinsSummary.metrics.ifThenCount,
      evidenceRate: smallWinsSummary.metrics.evidenceRate,
      evidenceCount: smallWinsSummary.metrics.evidenceCount,
      commitmentRate: smallWinsSummary.metrics.commitmentRate,
      commitmentCompleted: smallWinsSummary.metrics.commitmentCompleted,
      commitmentTotal: smallWinsSummary.metrics.commitmentTotal,
    },
    tier: smallWinsSummary.tier,
    tierLabel: TIER_CONFIG[smallWinsSummary.tier].label,
    tierMessage: TIER_CONFIG[smallWinsSummary.tier].message,
    averageRate: smallWinsSummary.averageRate,
    resilienceCount: resilienceData.count,
    resilienceBreakdown: resilienceData.breakdown,
    evidenceHighlights,
    vowEvolution,
    potentialStatement,
    toughLovePreview,
  };
}
