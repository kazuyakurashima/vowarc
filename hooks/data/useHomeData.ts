import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from './useUserProfile';
import { useVow } from './useVow';
import { useMeaningStatement } from './useMeaningStatement';
import { useCommitments } from './useCommitments';

/**
 * Aggregate hook for home screen data
 */
export function useHomeData() {
  const { user: authUser } = useAuth();
  const userId = authUser?.id;

  const { user, loading: userLoading, error: userError } = useUserProfile(userId);
  const { vow, loading: vowLoading, error: vowError } = useVow(userId);
  const { meaningStatement, loading: meaningLoading, error: meaningError } = useMeaningStatement(userId);
  const { commitments, loading: commitmentsLoading, error: commitmentsError } = useCommitments(userId);

  const loading = userLoading || vowLoading || meaningLoading || commitmentsLoading;
  const error = userError || vowError || meaningError || commitmentsError;

  return {
    user,
    vow,
    meaningStatement,
    commitments,
    loading,
    error,
  };
}
