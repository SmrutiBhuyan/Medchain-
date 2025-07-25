import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

export default function Layout() {
  return (
    <>
      <Header />
        <main>
            <Outlet/>
        </main>
      <Footer/>
    </>
  )
}
