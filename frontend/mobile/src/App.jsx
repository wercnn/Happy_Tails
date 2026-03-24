import './App.css'
import WelcomePage from './screens/welcome/WelcomePage'
import LoginPage from './screens/login/LoginPage'
import RoleSelect from './screens/roleSelect/RoleSelect'

function App() {
  return (
    <div className="app-row-layout">
      <WelcomePage />
      <LoginPage />
      <RoleSelect />
    </div>
  )
}

export default App
