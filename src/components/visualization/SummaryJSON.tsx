import { useAppStore } from '../../store/appStore'
import './SummaryJSON.css'

interface SummaryJSONProps {
  summary: {
    context_name: string
    automata: Array<{
      name: string
      states_count: number
      transitions_count: number
    }>
    formulas_count: number
    controllers_count: number
  }
}

export const SummaryJSON = ({ summary }: SummaryJSONProps) => {
  const { theme } = useAppStore()
  const jsonString = JSON.stringify(summary, null, 2)

  return (
    <div className="summary-json-container">
      <pre className={`summary-json-content ${theme === 'dark' ? 'summary-json-dark' : ''}`}>
        {jsonString}
      </pre>
    </div>
  )
}
