import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { CrashScreen } from './components/CrashScreen'
import './styles.css'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root')

createRoot(container).render(
	<StrictMode>
		<CrashScreen>
			<App />
		</CrashScreen>
	</StrictMode>,
)
