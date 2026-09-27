import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api'});
api.interceptors.request.use(c=>{const token=localStorage.getItem('token');if(token)c.headers.Authorization=`Bearer ${token}`;return c});
