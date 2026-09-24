import Sidebar from './Sidebar'
import Header from './Header'
import PlayerBar from './PlayerBar'
import RightPanel from './RightPanel'
import { useUIStore } from '../../store/useUIStore'

export default function ShellLayout({ children }) {
  const { isRightPanelOpen } = useUIStore()

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-on-surface flex flex-col">
      <Sidebar />
      <Header />
      <main
        className={`pt-16 pb-[76px] pl-[240px] h-full overflow-y-auto transition-all ${
          isRightPanelOpen ? 'pr-[320px]' : 'pr-0'
        }`}
      >
        <div className="p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
      <RightPanel />
      <PlayerBar />
    </div>
  )
}
