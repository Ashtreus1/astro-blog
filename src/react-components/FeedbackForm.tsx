import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const FeedbackForm: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    if (!feedback.trim()) {
      alert('⚠️ Please enter your feedback before submitting.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert([{ feedback_content: feedback }]);

      if (error) {
        console.error('Error inserting feedback:', error.message);
        alert('❌ Failed to submit feedback. Please try again.');
      } else {
        alert('✅ Thank you for your feedback!');
        setFeedback(''); // Clear the textarea
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('❌ Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-50 max-w-xl mx-auto mt-16 p-6 rounded-xl shadow-sm">
      <h5 className="text-lg font-semibold text-gray-800 mb-3 text-center">
        Was this article helpful?
      </h5>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Write your feedback..."
        className="w-full p-2 border rounded"
        rows={4}
      />
      <div className="text-center">
        <button
          onClick={submitFeedback}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </section>
  );
};

export default FeedbackForm;
