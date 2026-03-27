import './App.css'
import WelcomePage from './screens/Auth/welcome/WelcomePage'
import LoginPage from './screens/Auth/login/LoginPage'
import RoleSelect from './screens/Auth/roleSelect/RoleSelect'
import OwnerRegister from './screens/Auth/ownerRegistration/OwnerRegister'
import MinderRegister from './screens/Auth/minderRegistration/MinderRegister'
import OTP from './screens/Auth/otp/OTP'

function App() {
  return (
    <div className="app-container">
      <div className="app-row-layout">
        {/* Authentication Screens */}
        <WelcomePage />
        <LoginPage />
        <RoleSelect />
        <OwnerRegister />
        <MinderRegister />
        <OTP />
      </div>
      <div className="app-row-layout">
        {/* Pet Owner Screens */}
        
      </div>
    </div>

    
  )
}

export default App
