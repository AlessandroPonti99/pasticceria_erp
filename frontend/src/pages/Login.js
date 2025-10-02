import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, form)
      .then(res => {
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      })
      .catch(() => {
        setError('Credenziali errate');
      });
  };

  return (
    <div style={styles.container}>
      <img src="/logoPasticceria.jpeg" alt="Logo Pasticceria" style={styles.logo} />
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Login</h2>

        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button}>Accedi</button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9f2ec',
  },
  logo: {
    width: '200px',
    marginBottom: '20px',
  },
  form: {
    background: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '300px',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#d2955d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  }
};

export default Login;