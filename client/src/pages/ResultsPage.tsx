import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';

export function ResultsPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      gap: '24px',
    }}>
      <h2 style={{ fontSize: '28px', color: 'var(--color-primary)' }}>Game Over</h2>
      <Button onClick={() => navigate('/')}>Play Again</Button>
    </div>
  );
}
