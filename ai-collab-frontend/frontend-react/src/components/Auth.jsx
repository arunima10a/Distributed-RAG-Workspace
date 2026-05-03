import React, { useState } from 'react';

export default function Auth({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isRegister ? 'register' : 'login';
        const res = await fetch(`http://localhost:8081/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        const data = await res.json();
        if (res.ok) {
            if (isRegister) { alert("Registered! Please login."); setIsRegister(false); }
            else { onLogin(data); }
        } else { alert("Error: " + (data.error || "Action failed")); }
    };

    return (
        <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-black text-slate-800 mb-6">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <input type="text" placeholder="Username" className="w-full p-4 bg-slate-100 rounded-2xl outline-none text-slate-900 placeholder-slate-400"
                               onChange={e => setForm({...form, username: e.target.value})}/>
                    )}
                    <input type="email" placeholder="Email" className="w-full p-4 bg-slate-100 rounded-2xl outline-none text-slate-900 placeholder-slate-400"
                           onChange={e => setForm({...form, email: e.target.value})}/>
                    <input type="password" placeholder="Password" className="w-full p-4 bg-slate-100 rounded-2xl outline-none text-slate-900 placeholder-slate-400"
                           onChange={e => setForm({...form, password: e.target.value})}/>
                    <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
                        {isRegister ? 'Sign Up' : 'Login'}
                    </button>
                </form>
                <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-4 text-sm text-slate-400 font-medium">
                    {isRegister ? 'Already have an account? Login' : 'New here? Create an account'}
                </button>
            </div>
        </div>
    );
}