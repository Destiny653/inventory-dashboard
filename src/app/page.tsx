 import React from 'react'
import DashboardLayout from './dashboard/layout' 
import LoginPage from './login/page';
 
 
export default function Home() {
  return (
    <DashboardLayout> 
      <LoginPage/>
    </DashboardLayout>
  );
}
 