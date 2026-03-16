import { Button } from '../../components/common/Button'
import { useTutorial } from '../hooks/useTutorial'
import { gettingStartedTutorial } from '../content/getting-started'

export const TutorialLauncher = () => {
  const { startTutorial, isActive } = useTutorial('getting-started', gettingStartedTutorial)

  return (
    <Button variant="ghost" size="sm" onClick={startTutorial} title="Start tutorial">
      {isActive ? '🔄 Restart Tutorial' : '📚 Start Tutorial'}
    </Button>
  )
}
