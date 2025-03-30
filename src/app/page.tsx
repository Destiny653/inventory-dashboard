 import React from 'react'
import DashboardLayout from './dashboard/layout'
import ProfilePage from './dashboard/profile/page';
 
interface HomeProps {
  children: React.ReactNode;
}

export default function Home() {
  return (
    <DashboardLayout> 
      <ProfilePage/>
    </DashboardLayout>
  );
}
 