// GitHub同步配置（替换成你的信息）
const GITHUB_CONFIG = {
    gistId: "你的Gist ID", // 第一步复制的Gist ID
    token: "你的GitHub Token", // 第一步生成的Token
    filename: "car-inventory.json" // Gist里的文件名
};

// 从GitHub拉取最新库存
async function pullFromGitHub() {
    try {
        const response = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
            headers: {
                "Authorization": `token ${GITHUB_CONFIG.token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!response.ok) throw new Error(`GitHub API错误: ${response.status}`);
        
        const gist = await response.json();
        const inventoryData = JSON.parse(gist.files[GITHUB_CONFIG.filename].content);
        
        // 保存到本地并刷新页面
        localStorage.setItem('car_dealership_inventory_my', JSON.stringify(inventoryData));
        showSaveStatus("✅ 已从GitHub同步最新库存！");
        loadInventory(); // 重新加载库存
        return inventoryData;
    } catch (error) {
        showSaveStatus(`❌ 同步失败: ${error.message}`);
        console.error("GitHub拉取失败:", error);
        // 失败时用本地数据兜底
        return JSON.parse(localStorage.getItem('car_dealership_inventory_my') || '[]');
    }
}

// 把本地库存推送到GitHub
async function pushToGitHub() {
    const localInventory = JSON.parse(localStorage.getItem('car_dealership_inventory_my') || '[]');
    try {
        const response = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `token ${GITHUB_CONFIG.token}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                files: {
                    [GITHUB_CONFIG.filename]: {
                        content: JSON.stringify(localInventory, null, 2) // 格式化JSON，方便查看
                    }
                }
            })
        });

        if (!response.ok) throw new Error(`GitHub API错误: ${response.status}`);
        
        showSaveStatus("✅ 库存已同步到GitHub！所有员工可刷新查看");
        return true;
    } catch (error) {
        showSaveStatus(`❌ 同步失败: ${error.message}`);
        console.error("GitHub推送失败:", error);
        return false;
    }
}

// 初始化时自动拉取GitHub数据（页面加载时执行）
document.addEventListener('DOMContentLoaded', async () => {
    // 只有库存/分店/首页需要同步
    if (document.getElementById('car-stocks')) {
        await pullFromGitHub();
    }
});