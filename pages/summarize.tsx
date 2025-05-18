import EmailActionPage from '../components/Email/EmailActionPage';

const SummarizeEmailPage = () => {
  return (
    <EmailActionPage
      title="Summarize Email"
      action="summarize"
      placeholder="Paste the email content you want to summarize..."
    />
  );
};

export default SummarizeEmailPage; 