import './App.css'
import { Routes, Route } from 'react-router-dom'

/* Authentication screens */
import WelcomePage from './screens/Auth/welcome/WelcomePage'
import LoginPage from './screens/Auth/login/LoginPage'
import RoleSelect from './screens/Auth/roleSelect/RoleSelect'
import OwnerRegistration from './screens/Auth/ownerRegistration/OwnerRegister'
import MinderRegistration from './screens/Auth/minderRegistration/MinderRegister'
import OTP from './screens/Auth/otp/OTP'
import Identity from './screens/Auth/identity/identity'

import MindDash from './screens/Pet Minder/dashboard/Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RoleSelect />} />
      <Route path="/ownerReg" element={<OwnerRegistration />} />
      <Route path="/minderReg" element={<MinderRegistration />} />
      <Route path="/otp" element={<OTP />} />
      <Route path="/identity" element={<Identity />} />

      <Route path="/mindDash" element={<MindDash />} />
    </Routes>
  )
}

export default App