import { supabase } from '../../src/lib/supabaseClient.ts';

export async function submitFeedback() {
  const feedbackBox = document.getElementById('feedback-box');
  const feedbackContent = feedbackBox?.value;

  if (!feedbackContent || feedbackContent.trim() === '') {
    alert('⚠️ Please enter your feedback before submitting.');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([{ feedback_content: feedbackContent }]);

    if (error) {
      console.error('Error inserting feedback:', error.message);
      alert('❌ Failed to submit feedback. Please try again.');
    } else {
      alert('✅ Thank you for your feedback!');
      feedbackBox.value = ''; // Clear the input
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('❌ Something went wrong.');
  }
}

window.submitFeedback = submitFeedback;
