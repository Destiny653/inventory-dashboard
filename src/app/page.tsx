 import React from 'react'
import DashboardLayout from './dashboard/layout'
import ProfilePage from './dashboard/profile/page';
 
interface HomeProps {
  children: React.ReactNode;
}

export default function Home({ children }: HomeProps) {
  return (
    <DashboardLayout> 
      <ProfilePage/>
    </DashboardLayout>
  );
}
 