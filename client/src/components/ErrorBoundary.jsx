import { Component } from 'react';

// Показує текст помилки замість білого екрана, якщо щось падає під час рендера
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Помилка рендера:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-sm border border-gray-100 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Щось пішло не так</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Сторінку не вдалося показати. Спробуй перезавантажити — якщо не допоможе, надішли цей текст:
          </p>
          <pre className="text-xs bg-gray-50 dark:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg p-3 mb-4 overflow-x-auto whitespace-pre-wrap">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-accent-600 text-white rounded-lg py-2 font-semibold hover:bg-accent-700"
            >
              Перезавантажити
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg py-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Вийти
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
