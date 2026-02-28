import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="container mx-auto px-4 py-6 sm:py-8">
                {/* Header */}
                <header className="mb-8 sm:mb-12 flex justify-between items-center">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
                        启玩星球
                    </h1>
                    <div className="flex gap-2 sm:gap-4">
                        <Link
                            to="/login"
                            className="text-gray-600 hover:text-gray-800 font-medium text-sm sm:text-base"
                        >
                            登录
                        </Link>
                        <Link
                            to="/register"
                            className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 sm:px-6 rounded-full text-sm sm:text-base"
                        >
                            注册
                        </Link>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="mb-8 sm:mb-16">
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-3 sm:mb-4">
                            欢迎来到启玩星球！
                        </h2>
                        <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg">
                            在这里，孩子们可以通过有趣的游戏学习知识，探索世界，快乐成长！
                        </p>
                        <Link
                            to="/register"
                            className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 sm:px-8 rounded-full transition-colors text-base sm:text-lg w-full sm:w-auto"
                        >
                            开始游戏
                        </Link>
                    </div>
                </section>

                {/* Features */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-16">
                    <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                            <span className="text-2xl sm:text-3xl">🎮</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 text-center">
                            趣味游戏
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 text-center">
                            多种类型的益智游戏，让孩子在玩中学，学中玩
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                            <span className="text-2xl sm:text-3xl">📚</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 text-center">
                            循序渐进
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 text-center">
                            科学的关卡设计，难度逐步提升，符合儿童认知发展规律
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                            <span className="text-2xl sm:text-3xl">👨‍👩‍👧</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 text-center">
                            家长放心
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 text-center">
                            完善的家长监控系统，随时了解孩子的学习进度
                        </p>
                    </div>
                </section>

                {/* Game Types Preview */}
                <section className="mb-8 sm:mb-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">
                        游戏类型
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
                        {['拖拽', '配对', '计数', '拼图', '排序'].map((type) => (
                            <div
                                key={type}
                                className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl p-4 sm:p-6 text-white text-center hover:scale-105 transition-transform cursor-pointer"
                            >
                                <div className="text-3xl sm:text-4xl mb-2">🎯</div>
                                <div className="font-semibold text-sm sm:text-base">{type}游戏</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="text-center">
                    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 sm:p-8 md:p-12 text-white">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                            准备好开始探索了吗？
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90">
                            立即注册，开启孩子的奇妙学习之旅
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                            <Link
                                to="/register"
                                className="bg-white text-primary-600 font-semibold py-3 px-6 sm:px-8 rounded-full hover:bg-gray-100 transition-colors text-base sm:text-lg w-full sm:w-auto text-center"
                            >
                                免费注册
                            </Link>
                            <button className="bg-transparent border-2 border-white text-white font-semibold py-3 px-6 sm:px-8 rounded-full hover:bg-white/10 transition-colors text-base sm:text-lg w-full sm:w-auto">
                                了解更多
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-6 sm:py-8 mt-8 sm:mt-16">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm sm:text-base">
                        © 2024 启玩星球. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Home;
