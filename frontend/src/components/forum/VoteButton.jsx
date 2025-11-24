import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import './VoteButton.css';

/**
 * VoteButton Component - Button để vote upvote/downvote
 */
const VoteButton = ({
  score = 0,
  isUpvoted = false,
  isDownvoted = false,
  onVote,
  disabled = false,
  size = 'medium',
}) => {
  const { t } = useTranslation();
  const [isVoting, setIsVoting] = useState(false);

  const handleUpvote = async () => {
    if (disabled || isVoting) return;
    setIsVoting(true);
    try {
      await onVote(true);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDownvote = async () => {
    if (disabled || isVoting) return;
    setIsVoting(true);
    try {
      await onVote(false);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="vote-button-group">
      <Button
        variant={isUpvoted ? 'primary' : 'ghost'}
        size={size}
        onClick={handleUpvote}
        disabled={disabled || isVoting}
        className={`vote-button vote-up ${isUpvoted ? 'active' : ''}`}
        title={t('post.vote_up')}
      >
        ▲
      </Button>
      <span className="vote-score">{score}</span>
      <Button
        variant={isDownvoted ? 'danger' : 'ghost'}
        size={size}
        onClick={handleDownvote}
        disabled={disabled || isVoting}
        className={`vote-button vote-down ${isDownvoted ? 'active' : ''}`}
        title={t('post.vote_down')}
      >
        ▼
      </Button>
    </div>
  );
};

export default VoteButton;

