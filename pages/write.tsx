import EmailActionPage from '../components/Email/EmailActionPage';

const WriteEmailPage = () => {
  return (
    <EmailActionPage
      title="Write New Email ()"
      action="write"
      placeholder="Enter the topic or key points for your email..."
    />
  );
};

export default WriteEmailPage; 