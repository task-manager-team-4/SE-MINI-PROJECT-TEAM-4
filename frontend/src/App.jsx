import { useEffect, useState } from 'react'
import './App.css'

const API = 'http://localhost:5000/api'
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed']
const TASK_PRIORITIES = ['Low', 'Medium', 'High']

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('taskToken') || '',
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

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState('Medium')
  const [newDeadline, setNewDeadline] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)

  // FR-05: Edit task state
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('Medium')
  const [editDeadline, setEditDeadline] = useState('')
  const [editStatus, setEditStatus] = useState('Pending')
  const [savingEdit, setSavingEdit] = useState(false)

  // FR-06: Delete task state
  const [deletingTaskId, setDeletingTaskId] = useState(null)

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
        data.message || 'Registration successful. You can now log in.',
      )
    } catch (err) {
      setError(err.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  async function loadTasks(currentToken = token) {
    if (!currentToken) return

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

        throw new Error(data.error || data.message || 'Could not load tasks.')
      }

      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
    } catch (err) {
      setError(err.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  async function createTask(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!newTitle.trim()) {
      setError('Task title is required.')
      return
    }

    setCreatingTask(true)

    try {
      const response = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          priority: newPriority,
          deadline: newDeadline || null,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Could not create task.')
      }

      setNewTitle('')
      setNewDescription('')
      setNewPriority('Medium')
      setNewDeadline('')
      setMessage(data.message || 'Task created successfully!')
      await loadTasks(token)
    } catch (err) {
      setError(err.message || 'Could not create task.')
    } finally {
      setCreatingTask(false)
    }
  }

  // FR-05: Open the edit form with the task's existing values
  function startEditingTask(task) {
    setError('')
    setMessage('')
    setEditingTaskId(task.id)
    setEditTitle(task.title || '')
    setEditDescription(task.description || '')
    setEditPriority(task.priority || 'Medium')
    setEditStatus(task.status || 'Pending')

    if (task.deadline) {
      const date = new Date(task.deadline)
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
      )
      setEditDeadline(localDate.toISOString().slice(0, 16))
    } else {
      setEditDeadline('')
    }
  }

  // FR-05: Save the edited task through the authenticated API
  async function saveEditedTask(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!editTitle.trim()) {
      setError('Task title is required.')
      return
    }

    if (editTitle.trim().length > 200) {
      setError('Task title cannot exceed 200 characters.')
      return
    }

    if (!TASK_PRIORITIES.includes(editPriority)) {
      setError('Please select a valid priority.')
      return
    }

    if (!TASK_STATUSES.includes(editStatus)) {
      setError('Please select a valid status.')
      return
    }

    setSavingEdit(true)

    try {
      const response = await fetch(`${API}/tasks/${editingTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
          deadline: editDeadline
            ? new Date(editDeadline).toISOString()
            : null,
          status: editStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Could not update task.',
        )
      }

      setEditingTaskId(null)
      setMessage(data.message || 'Task updated successfully!')
      await loadTasks(token)
    } catch (err) {
      setError(err.message || 'Could not update task.')
    } finally {
      setSavingEdit(false)
    }
  }

  function cancelEditingTask() {
    setEditingTaskId(null)
    setEditTitle('')
    setEditDescription('')
    setEditPriority('Medium')
    setEditDeadline('')
    setEditStatus('Pending')
    setError('')
    setMessage('')
  }

  // FR-06: Delete a task after confirmation
  async function deleteTask(task) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
    )

    if (!confirmed) return

    setError('')
    setMessage('')
    setDeletingTaskId(task.id)

    try {
      const response = await fetch(`${API}/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Could not delete task.')
      }

      if (editingTaskId === task.id) {
        cancelEditingTask()
      }

      setTasks((currentTasks) =>
        currentTasks.filter((currentTask) => currentTask.id !== task.id),
      )

      setMessage(data.message || 'Task deleted successfully.')
    } catch (err) {
      setError(err.message || 'Could not delete task.')
    } finally {
      setDeletingTaskId(null)
    }
  }

  // Update a task's status
  async function updateTaskStatus(taskId, status) {
    setError('')
    setMessage('')
    setUpdatingTaskId(taskId)

    try {
      const response = await fetch(`${API}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Could not update task status.',
        )
      }

      setMessage(data.message || 'Task status updated successfully!')
      await loadTasks(token)
    } catch (err) {
      setError(err.message || 'Could not update task status.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  function logout() {
    localStorage.removeItem('taskToken')
    setToken('')
    setTasks([])
    setPassword('')
    setMessage('')
    setError('')
    setSearch('')
    setStatusFilter('All')
    cancelEditingTask()
  }

  useEffect(() => {
    if (token) {
      loadTasks(token)
    }
    // loadTasks is intentionally called when the authentication token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                isRegistering ? 'At least 8 characters' : 'Enter your password'
              }
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
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
            {isRegistering ? 'Already have an account?' : 'New here?'}{' '}
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

        <footer className="task-footer">Team 4 — Task Manager Application</footer>
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

        <button type="button" className="logout-button" onClick={logout}>
          Log out
        </button>
      </header>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

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
            <h2>Create a task</h2>
            <p>Add a new task to your account</p>
          </div>
        </div>

        <form className="create-task-form" onSubmit={createTask}>
          <label>
            Task title *
            <input
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              maxLength={200}
              placeholder="Enter task title"
              required
            />
          </label>

          <label>
            Priority
            <select
              value={newPriority}
              onChange={(event) => setNewPriority(event.target.value)}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className="form-full-width">
            Description
            <textarea
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="Describe your task (optional)"
            />
          </label>

          <label className="form-full-width">
            Deadline (optional)
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(event) => setNewDeadline(event.target.value)}
            />
          </label>

          <div className="form-full-width">
            <button type="submit" disabled={creatingTask}>
              {creatingTask ? 'Creating task...' : 'Create Task'}
            </button>
          </div>
        </form>
      </section>

      <section className="task-panel">
        <div className="panel-heading">
          <div>
            <h2>Task list</h2>
            <p>Tasks retrieved from your account</p>
          </div>
          <span className="task-count">{visibleTasks.length} tasks</span>
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
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadTasks(token)}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading && tasks.length === 0 ? (
          <p className="empty-state">Loading tasks...</p>
        ) : visibleTasks.length > 0 ? (
          <div className="task-list">
            {visibleTasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div className="task-card-top">
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description || 'No description provided.'}</p>
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
                  <div className="status-control">
                    <label htmlFor={`status-${task.id}`}>
                      <strong>Status:</strong>
                    </label>
                    <select
                      id={`status-${task.id}`}
                      className="status-select"
                      value={task.status}
                      disabled={
                        updatingTaskId === task.id ||
                        editingTaskId === task.id ||
                        deletingTaskId === task.id
                      }
                      onChange={(event) =>
                        updateTaskStatus(task.id, event.target.value)
                      }
                    >
                      {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {updatingTaskId === task.id && <span>Updating...</span>}
                  </div>

                  <span>
                    <strong>Due:</strong>{' '}
                    {task.deadline
                      ? new Date(task.deadline).toLocaleString()
                      : 'Not set'}
                  </span>

                  <span>
                    <strong>Task ID:</strong> {task.id}
                  </span>
                </div>

                {/* FR-05: Edit task form */}
                {editingTaskId === task.id ? (
                  <form
                    className="create-task-form"
                    onSubmit={saveEditedTask}
                  >
                    <h3 className="form-full-width">Edit Task</h3>

                    <label>
                      Task title *
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        maxLength={200}
                        required
                      />
                    </label>

                    <label>
                      Priority
                      <select
                        value={editPriority}
                        onChange={(event) => setEditPriority(event.target.value)}
                        required
                      >
                        {TASK_PRIORITIES.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-full-width">
                      Description
                      <textarea
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                        placeholder="Describe your task (optional)"
                      />
                    </label>

                    <label>
                      Deadline (optional)
                      <input
                        type="datetime-local"
                        value={editDeadline}
                        onChange={(event) =>
                          setEditDeadline(event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Status
                      <select
                        value={editStatus}
                        onChange={(event) => setEditStatus(event.target.value)}
                        required
                      >
                        {TASK_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="form-full-width task-edit-actions">
                      <button type="submit" disabled={savingEdit}>
                        {savingEdit ? 'Saving...' : 'Save Changes'}
                      </button>

                      <button
                        type="button"
                        className="logout-button"
                        onClick={cancelEditingTask}
                        disabled={savingEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="task-edit-actions">
                    <button
                      type="button"
                      onClick={() => startEditingTask(task)}
                      disabled={
                        savingEdit ||
                        updatingTaskId === task.id ||
                        deletingTaskId === task.id
                      }
                    >
                      Edit Task
                    </button>

                    <button
                      type="button"
                      className="delete-task-button"
                      onClick={() => deleteTask(task)}
                      disabled={
                        deletingTaskId === task.id ||
                        savingEdit ||
                        updatingTaskId === task.id
                      }
                    >
                      {deletingTaskId === task.id ? 'Deleting...' : 'Delete Task'}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            {tasks.length === 0
              ? 'You have no tasks yet. Create one using the form above.'
              : 'No tasks match your search or selected status.'}
          </p>
        )}
      </section>

      <footer className="task-footer">
        Team 4 — Task Manager Application
      </footer>
    </main>
  )
}

export default App