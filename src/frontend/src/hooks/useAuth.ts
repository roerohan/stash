import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface UserIdentity {
  email: string;
  name: string;
  id: string;
  groups: string[];
  amr: string[];
  idp: {
    id: string;
    type: string;
  };
  geo: {
    country: string;
  };
  user_uuid: string;
  account_id: string;
  ip: string;
}

const fetchUserIdentity = async () => {
  try {
    const { data } = await axios.get<UserIdentity>('/cdn-cgi/access/get-identity');
    return data;
  } catch (error) {
    // This endpoint will return a 4xx error if the user is not logged in.
    // We can treat this as the user being unauthenticated.
    return null;
  }
};

export const useAuth = () => {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['userIdentity'],
    queryFn: fetchUserIdentity,
    retry: false, // Don't retry on 4xx errors
    staleTime: Infinity, // Identity doesn't change often
    gcTime: Infinity, // Keep it in cache
  });

  return {
    user,
    isAuthenticated: !!user && !isError,
    isLoading,
  };
};
