document.addEventListener('DOMContentLoaded', () => {
    // Handle feedback submission
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedback = document.querySelector('input[name="feedback"]:checked').value;
        const urlParams = new URLSearchParams(window.location.search);
        const link = urlParams.get('link');
  
        const response = await fetch('/submit-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link, feedback }),
        });
  
        if (response.ok) {
          alert('Thank you for your feedback!');
          window.location.href = '/index.html';
        } else {
          alert('Failed to submit feedback.');
        }
      });
    }
  
    // Handle feedback link generation
    const generateLink = document.getElementById('generateLink');
    if (generateLink) {
      generateLink.addEventListener('click', async () => {
        const userId = 1; // Hardcoded user ID for simplicity; replace as needed
        const response = await fetch('/generate-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
  
        const data = await response.json();
        document.getElementById('feedbackLink').textContent = `Share this link: ${data.link}`;
      });
    }
  
    // Display feedbacks in the dashboard
    const feedbackList = document.getElementById('feedbackList');
    if (feedbackList) {
      const userId = 1; // Hardcoded user ID for simplicity
      fetch(`/feedbacks/${userId}`)
        .then((response) => response.json())
        .then((data) => {
          data.forEach((feedback) => {
            const li = document.createElement('li');
            li.textContent = feedback.feedback;
            feedbackList.appendChild(li);
          });
        });
    }
  });
  