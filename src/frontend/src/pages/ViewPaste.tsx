import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // Or your preferred theme
import { useEffect, useRef } from 'react';

const fetchPaste = async (id: string) => {
  const { data } = await axios.get(`/v1/paste/${id}`);
  return data;
};

const ViewPaste = () => {
  const { id } = useParams<{ id: string }>();
  const codeRef = useRef<HTMLElement | null>(null);

  const { data: paste, isLoading, isError } = useQuery({
    queryKey: ['paste', id],
    queryFn: () => fetchPaste(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (paste && codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [paste]);

  if (isLoading) return <div className="text-center">Loading paste...</div>;
  if (isError) return <div className="text-center text-red-500">Error fetching paste. It may be private or may not exist.</div>;

  return (
    <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">{paste.title || 'Untitled Paste'}</h1>
        <div className="text-sm text-gray-400 mb-4">
            Language: {paste.language || 'plaintext'} | Visibility: {paste.visibility.charAt(0).toUpperCase() + paste.visibility.slice(1)} | Posted: {new Date(paste.created_at).toLocaleString()}
        </div>
        <div className="bg-gray-800 rounded-lg overflow-x-auto">
            <pre className="p-4"><code ref={codeRef} className={`language-${paste.language}`}>
                {paste.content}
            </code></pre>
        </div>
    </div>
  );
};

export default ViewPaste;
