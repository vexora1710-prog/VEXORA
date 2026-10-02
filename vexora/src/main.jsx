import React from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './pages/Home.jsx'
import './styles/index.css'
createRoot(document.getElementById('root')).render(
  <React.StrictMode><MotionConfig reducedMotion="user"><App /></MotionConfig></React.StrictMode>
)
