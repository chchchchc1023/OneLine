import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// 添加静态导出配置，解决"output: export"模式下的构建错误
export const dynamic = 'force-static';

// 支持OPTIONS请求，用于CORS预检
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// 支持GET请求
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'API代理服务正常运行' },
    { status: 200 }
  );
}

// 主要的POST请求处理
export async function POST(request: NextRequest) {
  try {
    // 从环境变量获取API端点和密钥
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiKey = process.env.API_KEY;

    // 检查环境变量是否配置
    if (!apiEndpoint || !apiKey) {
      return NextResponse.json(
        { error: '服务器API配置缺失' },
        { status: 500 }
      );
    }

    // 解析请求体
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: '无效的请求数据格式' },
        { status: 400 }
      );
    }

    // 从请求中获取模型名称，如果没有则使用环境变量中的默认值
    const model = requestData.model || process.env.API_MODEL || 'gemini-2.0-pro-exp-search';

    // 构建发送到实际API的请求
    const payload = {
      ...requestData,
      model: model
    };

    // 设置请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // 打印请求信息用于调试（不包含敏感信息）
    console.log('发送请求到API端点:', apiEndpoint);
    console.log('请求模型:', model);

    // 发送请求到实际API
    const response = await axios.post(apiEndpoint, payload, { 
      headers,
      // 增加超时设置
      timeout: 30000
    });

    // 返回API响应
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API代理请求失败:', error);
    
    // 返回更详细的错误响应
    return NextResponse.json(
      { 
        error: '代理请求失败', 
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        details: error.response?.data || '未知错误'
      },
      { status: error.response?.status || 500 }
    );
  }
}
