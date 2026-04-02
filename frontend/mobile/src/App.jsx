import './App.css'
import WelcomePage from './screens/Auth/welcome/WelcomePage'
import LoginPage from './screens/Auth/login/LoginPage'
import RoleSelect from './screens/Auth/roleSelect/RoleSelect'
import OwnerRegister from './screens/Auth/ownerRegistration/OwnerRegister'
import MinderRegister from './screens/Auth/minderRegistration/MinderRegister'
import OTP from './screens/Auth/otp/OTP'
import OwnwerHome from './screens/Pet Owner - Pets/ownerHome/OwnerHome'
import MyPets from './screens/Pet Owner - Pets/myPets/MyPets'
import CreatePet from './screens/Pet Owner - Pets/createPet/CreatePet'
import PetDetail from './screens/Pet Owner - Pets/petDetail/PetDetail'
import AddHealth from './screens/Pet Owner - Pets/addHealth/AddHealth'
import UploadPhoto from './screens/Pet Owner - Pets/uploadPhoto/UploadPhoto'
import Dashboard from './screens/Pet Minder/dashboard/Dashboard'
import Services from './screens/Pet Minder/services/Service'
import Availability from './screens/Pet Minder/availability/Availability'
import Requests from './screens/Pet Minder/requests/Requests'
import Accept from './screens/Pet Minder/accept/Accept'
import Notifications from './screens/Notifications & Profile/notifications/Notifications'
import ProfileSettings from './screens/Notifications & Profile/profileSettings/ProfileSettings'
import SearchMinders from './screens/Search & Discovery/searchMinders/SearchMinders'
import Filters from './screens/Search & Discovery/filters/Filters'
import MinderProfile from './screens/Search & Discovery/minderProfile/MinderProfile'
import SelectService from './screens/Booking Flow/selectService/SelectService'
import SelectDates from './screens/Booking Flow/selectDates/SelectDates'
import AvailabilityCalendar from './screens/Booking Flow/availabilityCalendar/AvailabilityCalendar'
import Summary from './screens/Booking Flow/summary/Summary'
import Confirmed from './screens/Booking Flow/confirmed/Confirmed'
import RequestSent from './screens/Booking Flow/requestSent/RequestSent'
import History from './screens/Booking Flow/history/History'
import BookingDetails from './screens/Booking Flow/bookingDetails/BookingDetails'
import Cancel from './screens/Booking Flow/cancel/Cancel'
import Report from './screens/Emergency/ReportIncident'
import ReportSubmitted from './screens/Emergency/reportSubmitted/ReportSubmitted'

function App() {
  return (

    <WelcomePage />




    // Below is for testing purposes only - to show all screens in one place.
    /*
    <div className="app-container">
      <div className="app-row-layout">
        {/* Authentication Screens 
        <WelcomePage />
        <LoginPage />
        <RoleSelect />
        <OwnerRegister />
        <MinderRegister />
        <OTP />
      </div>
      <div className="app-row-layout">
        {/* Pet Owner Screens 
        <OwnwerHome />
        <MyPets />
        <CreatePet />
        <PetDetail />
        <AddHealth />
        <UploadPhoto />
      </div>
      <div className="app-row-layout">
        {/* Pet Minder Screens 
        <Dashboard />
        <Services />
        <Availability />
        <Requests />
        <Accept />
      </div>
      <div className="app-row-layout">
        {/* Notifications & Profile 
        <Notifications />
        <ProfileSettings />
      </div>
      <div className="app-row-layout">
        {/* Search & Discovery 
        <SearchMinders />
        <Filters />
        <MinderProfile />
      </div>
      <div className="app-row-layout">
        {/* Booking flow 
        <SelectService />
        <SelectDates />
        <AvailabilityCalendar />
        <Summary /> 
        {/* The summary is showing what it would look like with a single-day booking and a multi-day booking. 
        <Confirmed />
        <RequestSent />
        <History />
        <BookingDetails />
        <Cancel />
      </div>
      <div className="app-row-layout">
        {/* Emergency 
        <Report />
        <ReportSubmitted />
      </div>
    </div> */

    
  )
}

export default App
