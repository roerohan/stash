import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

// In a real app, you'd get this from an auth context
const isAuthenticated = false; // Placeholder

const fetchMyPastes = async () => {
  const { data } = await axios.get('/v1/my-pastes');
  return data;
};

const fetchPublicPastes = async () => {
    const { data } = await axios.get('/v1/public-pastes');
    return data;
};

const Dashboard = () => {
  const { data: myPastes, isLoading: isLoadingMyPastes } = useQuery({
    queryKey: ['myPastes'],
    queryFn: fetchMyPastes,
    enabled: isAuthenticated,
  });

  const { data: publicPastes, isLoading: isLoadingPublicPastes } = useQuery({
      queryKey: ['publicPastes'],
      queryFn: fetchPublicPastes,
      enabled: !isAuthenticated,
  });

  const isLoading = isLoadingMyPastes || isLoadingPublicPastes;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">
        {isAuthenticated ? 'My Pastes' : 'Recent Public Pastes'}
      </h1>
      {isLoading && <p>Loading pastes...</p>}
      {isAuthenticated ? (
        <div>
          {myPastes && myPastes.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {myPastes.map((paste: any) => (
                <li key={paste.id} className="py-4">
                  <Link to={`/paste/${paste.id}`} className="text-lg font-semibold text-indigo-400 hover:underline">
                    {paste.title || 'Untitled Paste'}
                  </Link>
                  <p className="text-gray-400 text-sm mt-1 truncate">{paste.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>You haven't created any private pastes yet.</p>
          )}
        </div>
      ) : (
        <div>
          {publicPastes && publicPastes.length > 0 ? (
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
            <p>No public pastes to show right now. Be the first to create one!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
