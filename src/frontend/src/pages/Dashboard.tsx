import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const fetchMyPastes = async () => {
  const { data } = await axios.get('/v1/my/pastes');
  return data;
};

const fetchPublicPastes = async () => {
    const { data } = await axios.get('/v1/public-pastes');
    return data;
};

const deletePaste = async (id: string) => {
    await axios.delete(`/v1/my/paste/${id}`);
};

const Dashboard = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deletePaste,
    onSuccess: () => {
      toast.success('Paste deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['myPastes'] });
    },
    onError: () => {
      toast.error('Failed to delete paste.');
    },
  });

  const { data: myPastes, isLoading: isLoadingMyPastes } = useQuery({
    queryKey: ['myPastes'],
    queryFn: fetchMyPastes,
    enabled: !isAuthLoading && isAuthenticated,
  });

  const { data: publicPastes, isLoading: isLoadingPublicPastes } = useQuery({
      queryKey: ['publicPastes'],
      queryFn: fetchPublicPastes,
      enabled: !isAuthLoading, // Always fetch public pastes once auth is checked
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {isAuthLoading && <p className="text-gray-400">Loading...</p>}

      {!isAuthLoading && isAuthenticated && (
        <section>
          <h1 className="text-3xl font-bold mb-6 text-white">My Pastes</h1>
          {isLoadingMyPastes ? (
            <p className="text-gray-400">Loading your pastes...</p>
          ) : myPastes && myPastes.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {myPastes.map((paste: any) => (
                <li key={paste.id} className="py-4 flex justify-between items-center">
                  <div>
                    <Link to={`/paste/${paste.id}`} className="text-lg font-semibold text-indigo-400 hover:underline">
                      {paste.title || 'Untitled Paste'}
                    </Link>
                    <p className="text-gray-400 text-sm mt-1 truncate">{paste.content}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this paste?')) {
                        deleteMutation.mutate(paste.id);
                      }
                    }}
                    disabled={deleteMutation.isPending && deleteMutation.variables === paste.id}
                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete paste"
                  >
                    {deleteMutation.isPending && deleteMutation.variables === paste.id ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">You haven't created any private pastes yet.</p>
          )}
        </section>
      )}

      {!isAuthLoading && (
        <section>
          <h1 className="text-3xl font-bold mb-6 text-white">Recent Public Pastes</h1>
          {isLoadingPublicPastes ? (
            <p className="text-gray-400">Loading public pastes...</p>
          ) : publicPastes && publicPastes.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {publicPastes.map((paste: any) => (
                <li key={paste.id} className="py-4">
                  <Link to={`/paste/${paste.id}`} className="text-lg font-semibold text-indigo-400 hover:underline">
                    {paste.title || 'Untitled Paste'}
                  </Link>
                  <p className="text-gray-400 text-sm mt-1 truncate">{paste.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No public pastes to show right now. Be the first to create one!</p>
          )}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
