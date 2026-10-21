
import { useEffect, useState } from 'react'
import './App.css'

const API = 'http://localhost:5000/api'

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('taskToken') || ''
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [tasks, setTasks] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function login(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login failed.')
      }

      if (!data.token) {
        throw new Error('The server did not return a login token.')
      }

      localStorage.setItem('taskToken', data.token)
      setToken(data.token)
      setPassword('')
      setMessage('')
    } catch (err) {
      setError(err.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  async function register(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Registration failed.')
      }

      setIsRegistering(false)
      setPassword('')
      setMessage(
        data.message || 'Registration successful. You can now log in.'
      )
    } catch (err) {
      setError(err.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  async function loadTasks(currentToken) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout()
          throw new Error('Your session has expired. Please log in again.')
        }
        throw new Error(data.error || 'Could not load tasks.')
      }

      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
    } catch (err) {
      setError(err.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('taskToken')
    setToken('')
    setTasks([])
    setPassword('')
    setMessage('')
    setError('')
  }

  useEffect(() => {
    if (token) {
      loadTasks(token)
    }
  }, [token])

  const visibleTasks = tasks.filter((task) => {
    const query = search.toLowerCase()

    const matchesSearch =
      (task.title || '').toLowerCase().includes(query) ||
      (task.description || '').toLowerCase().includes(query)

    const matchesStatus =
      statusFilter === 'All' || task.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (!token) {
    return (
      <main className="task-page">
        <header className="task-header">
          <div>
            <p className="eyebrow">TEAM 4 · TASK MANAGER</p>
            <h1>{isRegistering ? 'Create your account' : 'Welcome back'}</h1>
            <p className="subtitle">
              {isRegistering
                ? 'Register to start managing your tasks.'
                : 'Log in to view your authorized tasks.'}
            </p>
          </div>
        </header>

        <section className="task-panel">
          <div className="panel-heading">
            <div>
              <h2>{isRegistering ? 'Create Account' : 'Login'}</h2>
              <p>
                {isRegistering
                  ? 'Enter your email and create a password.'
                  : 'Log in to view tasks belonging to your account.'}
              </p>
            </div>
          </div>

          <form
            onSubmit={isRegistering ? register : login}
            className="login-form"
          >
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                isRegistering
                  ? 'At least 8 characters'
                  : 'Enter your password'
              }
              autoComplete={
                isRegistering ? 'new-password' : 'current-password'
              }
              minLength={isRegistering ? 8 : undefined}
              required
            />

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <button type="submit" disabled={loading}>
              {loading
                ? isRegistering
                  ? 'Creating account...'
                  : 'Logging in...'
                : isRegistering
                  ? 'Create Account'
                  : 'Log in'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegistering
              ? 'Already have an account?'
              : 'New here?'}{' '}
            <button
              type="button"
              className="auth-switch-button"
              onClick={() => {
                setIsRegistering((previous) => !previous)
                setError('')
                setMessage('')
                setPassword('')
              }}
            >
              {isRegistering ? 'Log in' : 'Create account'}
            </button>
          </p>
        </section>

        <footer className="task-footer">
          Team 4 — Task Manager Application
        </footer>
      </main>
    )
  }

  return (
    <main className="task-page">
      <header className="task-header">
        <div>
          <p className="eyebrow">TEAM 4 · TASK MANAGER</p>
          <h1>My Tasks</h1>
          <p className="subtitle">
            View and keep track of the tasks available to you.
          </p>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          Log out
        </button>
      </header>

      {error && <p className="error-message">{error}</p>}

      <section className="task-summary">
        <div className="summary-card">
          <span>Total tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="summary-card">
          <span>In progress</span>
          <strong>
            {tasks.filter((task) => task.status === 'In Progress').length}
          </strong>
        </div>

        <div className="summary-card">
          <span>Pending</span>
          <strong>
            {tasks.filter((task) => task.status === 'Pending').length}
          </strong>
        </div>
      </section>

      <section className="task-panel">
        <div className="panel-heading">
          <div>
            <h2>Task list</h2>
            <p>Tasks retrieved from your account</p>
          </div>

          <span className="task-count">
            {visibleTasks.length} tasks
          </span>
        </div>

        <div className="task-controls">
          <input
            type="search"
            placeholder="Search tasks..."
            aria-label="Search tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter tasks by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <button
            type="button"
            onClick={() => loadTasks(token)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="empty-state">Loading tasks...</p>
        ) : visibleTasks.length > 0 ? (
          <div className="task-list">
            {visibleTasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div className="task-card-top">
                  <div>
                    <h3>{task.title}</h3>
                    <p>
                      {task.description || 'No description provided.'}
                    </p>
                  </div>

                  <span
                    className={`priority priority-${(
                      task.priority || 'Medium'
                    ).toLowerCase()}`}
                  >
                    {task.priority || 'Medium'}
                  </span>
                </div>

                <div className="task-meta">
                  <span>
                    <strong>Status:</strong> {task.status}
                  </span>

                  <span>
                    <strong>Due:</strong>{' '}
                    {task.deadline
                      ? new Date(task.deadline).toLocaleDateString()
                      : 'Not set'}
                  </span>

                  <span>
                    <strong>Task ID:</strong> {task.id}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            {tasks.length === 0
              ? 'You have no tasks yet.'
              : 'No tasks match your search or selected status.'}
          </p>
        )}
      </section>

      <footer className="task-footer">
        Team 4 — Issue #4: View Authorized Tasks
      </footer>
    </main>
  )
}

export default App
