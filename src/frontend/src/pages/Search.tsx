import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

const searchPastes = async (query: string) => {
  const { data } = await axios.post('/v1/search', { query });
  return data;
};

const Search = () => {
  const [query, setQuery] = useState('');
  const mutation = useMutation({ mutationFn: searchPastes });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      mutation.mutate(query);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Search Pastes</h1>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center sm:space-x-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:flex-grow bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2 sm:mb-0"
          placeholder="Enter your search query..."
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {mutation.isPending ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div>
        {mutation.isSuccess && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results ({mutation.data.length})</h2>
            {mutation.data.length === 0 ? (
              <p>No results found.</p>
            ) : (
              <ul className="divide-y divide-gray-700">
                {mutation.data.map((paste: any) => (
                  <li key={paste.id} className="py-4">
                    <Link to={`/paste/${paste.id}`} className="text-lg font-semibold text-indigo-400 hover:underline">
                      {paste.title || 'Untitled Paste'}
                    </Link>
                    <p className="text-gray-400 text-sm mt-1 truncate">{paste.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {mutation.isError && (
          <p className="text-red-500">An error occurred during the search.</p>
        )}
      </div>
    </div>
  );
};

export default Search;
