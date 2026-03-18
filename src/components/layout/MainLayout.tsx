import { ReactNode } from 'react'
import { Header } from './Header'
import './Layout.css'

interface MainLayoutProps {
  children: ReactNode
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-layout-main">
        {children}
      </main>
    </div>
  )
}
