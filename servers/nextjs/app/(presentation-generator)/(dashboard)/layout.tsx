import React from 'react'
import DashboardSidebar from './Components/DashboardSidebar'

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='flex pr-4 bg-[#111111]'>
            <DashboardSidebar />
            <div className='w-full'>

                {children}
            </div>
        </div>
    )
}

export default layout