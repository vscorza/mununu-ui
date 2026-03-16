import { TutorialStep } from '../types'

export const gettingStartedTutorial: TutorialStep[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Welcome to HOLIDAY Web Client!</h3>
        <p>
          This tutorial will guide you through the main features of the application. Let's get
          started!
        </p>
      </div>
    ),
    placement: 'center',
  },
  {
    target: 'header',
    title: 'Navigation Header',
    content: (
      <p>
        The header provides quick access to main sections: Home, Editor, and Visualization. You can
        also toggle between light and dark themes here.
      </p>
    ),
    placement: 'bottom',
  },
  {
    target: 'aside',
    title: 'Sidebar Navigation',
    content: (
      <p>
        The sidebar contains all available features organized by category: Editors, Visualizations,
        and Workflows. Click any item to navigate.
      </p>
    ),
    placement: 'right',
  },
  {
    target: '[data-tutorial="connection-status"]',
    title: 'API Connection Status',
    content: (
      <p>
        This shows the connection status to the HOLIDAY API server. Make sure the server is running
        for full functionality.
      </p>
    ),
    placement: 'top',
  },
  {
    target: 'body',
    title: "You're all set!",
    content: (
      <p>
        You can now explore the application. Use the sidebar to navigate to different features. You
        can restart this tutorial anytime from the help menu.
      </p>
    ),
    placement: 'center',
  },
]
