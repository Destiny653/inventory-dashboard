 import React from 'react'
import DashboardLayout from './dashboard/layout'  
import AccountPage from '@/components/dashboard/account';
 
 
export default function Home() {
  return (
    <DashboardLayout> 
       <AccountPage/>
    </DashboardLayout>
  );
}
 