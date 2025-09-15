import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const createPaste = async (data: { title: string; content: string; language: string }) => {
  const { data: response } = await axios.post('/v1/paste', data);
  return response;
};

const NewPaste = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const navigate = useNavigate();

  const mutation = useMutation({ 
      mutationFn: createPaste, 
      onSuccess: (data) => {
        toast.success('Paste created successfully!');
        navigate(`/paste/${data.id}`);
      },
      onError: () => {
        toast.error('Failed to create paste.');
      }
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ title, content, language });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Create a New Paste</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Optional title for your paste"
          />
        </div>
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-300">Language</label>
          <input
            type="text"
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., javascript, python, plaintext"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300">Content</label>
          <textarea
            id="content"
            rows={20}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
            required
            placeholder="Paste your content here..."
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {mutation.isPending ? 'Creating...' : 'Create Paste'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPaste;
