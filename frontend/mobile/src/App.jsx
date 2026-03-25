import './App.css'
import WelcomePage from './screens/welcome/WelcomePage'
import LoginPage from './screens/login/LoginPage'
import RoleSelect from './screens/roleSelect/RoleSelect'
import OwnerRegister from './screens/ownerRegistration/OwnerRegister'
import MinderRegister from './screens/minderRegistration/MinderRegister'
import OTP from './screens/otp/OTP'

function App() {
  return (
    <div className="app-row-layout">
      <WelcomePage />
      <LoginPage />
      <RoleSelect />
      <OwnerRegister />
      <MinderRegister />
      <OTP />
    </div>
  )
}

export default App
