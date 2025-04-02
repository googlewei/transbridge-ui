import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

// 添加 SpeechRecognition 类型声明
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    webkitAudioContext: typeof AudioContext;
  }
  interface Navigator {
    webkitGetUserMedia?: (
      constraints: MediaStreamConstraints,
      successCallback: (stream: MediaStream) => void,
      errorCallback: (error: Error) => void
    ) => void;
    mozGetUserMedia?: (
      constraints: MediaStreamConstraints,
      successCallback: (stream: MediaStream) => void,
      errorCallback: (error: Error) => void
    ) => void;
    msGetUserMedia?: (
      constraints: MediaStreamConstraints,
      successCallback: (stream: MediaStream) => void,
      errorCallback: (error: Error) => void
    ) => void;
    getUserMedia?: (
      constraints: MediaStreamConstraints,
      successCallback: (stream: MediaStream) => void,
      errorCallback: (error: Error) => void
    ) => void;
  }
  interface MediaDevices {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  }
}

function App() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [swapError, setSwapError] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ZH');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showSourceCopySuccess, setShowSourceCopySuccess] = useState(false);
  const [translationTime, setTranslationTime] = useState(0);
  const [isAutoTranslate, setIsAutoTranslate] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHandwriting, setIsHandwriting] = useState(false);
  const [baiduAccessToken, setBaiduAccessToken] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [recognizeGranularity, setRecognizeGranularity] = useState('big');
  const [showProbability, setShowProbability] = useState(false);
  const [detectDirection, setDetectDirection] = useState(false);
  const [detectAlteration, setDetectAlteration] = useState(false);
  const [handwritingLanguage, setHandwritingLanguage] = useState('auto_detect');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL ; // 替换为您的实际API服务器地址
  //const apiBaseUrl = window.location.protocol + '//' + window.location.hostname + ':38076';
  const [apiKey, setApiKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sourceSelectRef = useRef<HTMLSelectElement>(null);
  const targetSelectRef = useRef<HTMLSelectElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  const [recognitionError, setRecognitionError] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const animationFrame = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 280, height: 280 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ width: 0, height: 0 });
  const [isSpeakingSource, setIsSpeakingSource] = useState(false);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [translationHistory, setTranslationHistory] = useState<Array<{
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    timestamp: number;
  }>>([]);
  const [copyError, setCopyError] = useState(false);

  // 语言分组数据
  const languageGroups = {
    common: [
      { code: 'ZH', name: '中文', flag: 'cn' },
      { code: 'ZH-TW', name: '繁体中文', flag: 'tw' },
      { code: 'EN', name: '英语', flag: 'us' },
      { code: 'JA', name: '日语', flag: 'jp' },
      { code: 'KO', name: '韩语', flag: 'kr' },
      { code: 'FR', name: '法语', flag: 'fr' },
      { code: 'DE', name: '德语', flag: 'de' },
      { code: 'ES', name: '西班牙语', flag: 'es' },
      { code: 'RU', name: '俄语', flag: 'ru' },
      { code: 'AR', name: '阿拉伯语', flag: 'sa' }
    ],
    asia: [
      { code: 'BN', name: '孟加拉语', flag: 'bd' },
      { code: 'MY', name: '缅甸语', flag: 'mm' },
      { code: 'HI', name: '印地语', flag: 'in' },
      { code: 'ID', name: '印尼语', flag: 'id' },
      { code: 'TH', name: '泰语', flag: 'th' },
      { code: 'VI', name: '越南语', flag: 'vn' }
    ]
  };

  useEffect(() => {
    // 从环境变量获取 API 密钥
    const envApiKey = process.env.REACT_APP_TRANSLATE_API_KEY;
    if (!envApiKey) {
      console.error('未配置翻译 API 密钥，请在 .env 文件中设置 REACT_APP_TRANSLATE_API_KEY');
      return;
    }
    setApiKey(envApiKey);
  }, []);

  // 添加自动聚焦效果
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 添加历史记录处理函数
  useEffect(() => {
    // 从localStorage加载历史记录
    const savedHistory = localStorage.getItem('translationHistory');
    if (savedHistory) {
      setTranslationHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 保存翻译历史
  const saveToHistory = (sourceText: string, result: string) => {
    const newHistory = {
      sourceText,
      translatedText: result,
      sourceLang,
      targetLang,
      timestamp: Date.now()
    };
    
    const updatedHistory = [newHistory, ...translationHistory].slice(0, 50); // 只保留最近50条记录
    setTranslationHistory(updatedHistory);
    localStorage.setItem('translationHistory', JSON.stringify(updatedHistory));
  };

  const translateText = async () => {
    if (!inputText) {
      setTranslatedText('');
      setError('');
      return;
    }

    setIsTranslating(true);
    setError('');
    const startTime = Date.now();
    
    try {
      const response = await axios.post(`${apiBaseUrl}/translate`, 
        {
          text: inputText,
          source_lang: sourceLang,
          target_lang: targetLang
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      const endTime = Date.now();
      setTranslationTime(endTime - startTime);
      
      if (response.data && response.data.data) {
        setTranslatedText(response.data.data);
        saveToHistory(inputText, response.data.data);
      } else if (typeof response.data === 'string') {
        setTranslatedText(response.data);
        saveToHistory(inputText, response.data);
      } else {
        console.error('翻译返回数据:', response.data);
        setError('翻译服务异常，请稍后重试');
      }
    } catch (error: any) {
      console.error('翻译出错:', error);
      if (error.response) {
        // 服务器返回错误
        switch (error.response.status) {
          case 401:
            setError('认证失败，请检查 API 密钥');
            break;
          case 429:
            setError('请求过于频繁，请稍后再试');
            break;
          default:
            setError(`服务器错误 (${error.response.status}): ${JSON.stringify(error.response.data)}`);
        }
      } else if (error.request) {
        // 请求发出但没有收到响应
        setError('无法连接到翻译服务器，请检查服务是否运行');
      } else {
        // 请求设置时发生错误
        setError('请求设置错误: ' + error.message);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (!isAutoTranslate) return;
    
    const debounceTimer = setTimeout(translateText, 500);
    return () => clearTimeout(debounceTimer);
  }, [inputText, sourceLang, targetLang, isAutoTranslate]);

  // 添加翻译完成后的焦点处理
  useEffect(() => {
    if (!isTranslating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTranslating]);

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      setShowError(true);
      setSwapError('自动检测语言不能交换位置');
      setTimeout(() => {
        setShowError(false);
        setSwapError('');
      }, 2000);
      return;
    }
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    if (translatedText) {
      setInputText(translatedText);
    }
  };

  const handleSpeak = (text: string, lang: string, isSource: boolean) => {
    if ('speechSynthesis' in window) {
      // 停止当前正在播放的语音
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置语言
      switch(lang) {
        case 'auto':
          // 对于自动检测，我们尝试检测文本的第一个字符
          if (/[\u4e00-\u9fa5]/.test(text[0])) {
            utterance.lang = 'zh-CN';
          } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text[0])) {
            utterance.lang = 'ja-JP';
          } else if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text[0])) {
            utterance.lang = 'ko-KR';
          } else if (/[\u0600-\u06FF]/.test(text[0])) {
            utterance.lang = 'ar-SA';
          } else if (/[\u0900-\u097F]/.test(text[0])) {
            utterance.lang = 'hi-IN';
          } else {
            utterance.lang = 'en-US';
          }
          break;
        // 东亚语言
        case 'ZH':
          utterance.lang = 'zh-CN';
          break;
        case 'ZH-TW':
          utterance.lang = 'zh-TW';
          break;
        case 'JA':
          utterance.lang = 'ja-JP';
          break;
        case 'KO':
          utterance.lang = 'ko-KR';
          break;
        // 欧洲语言
        case 'EN':
          utterance.lang = 'en-US';
          break;
        case 'FR':
          utterance.lang = 'fr-FR';
          break;
        case 'DE':
          utterance.lang = 'de-DE';
          break;
        case 'ES':
          utterance.lang = 'es-ES';
          break;
        case 'IT':
          utterance.lang = 'it-IT';
          break;
        case 'RU':
          utterance.lang = 'ru-RU';
          break;
        case 'PT':
          utterance.lang = 'pt-PT';
          break;
        case 'NL':
          utterance.lang = 'nl-NL';
          break;
        case 'PL':
          utterance.lang = 'pl-PL';
          break;
        // 其他语言
        case 'AR':
          utterance.lang = 'ar-SA';
          break;
        case 'HI':
          utterance.lang = 'hi-IN';
          break;
        case 'TH':
          utterance.lang = 'th-TH';
          break;
        case 'VI':
          utterance.lang = 'vi-VN';
          break;
        case 'ID':
          utterance.lang = 'id-ID';
          break;
        case 'MS':
          utterance.lang = 'ms-MY';
          break;
        case 'TR':
          utterance.lang = 'tr-TR';
          break;
        default:
          utterance.lang = 'en-US';
      }

      // 优化语音合成参数
      utterance.rate = 1.0;  // 语速 (0.1 到 10)
      utterance.pitch = 1.0; // 音高 (0 到 2)
      utterance.volume = 1.0; // 音量 (0 到 1)

      utterance.onstart = () => {
        if (isSource) {
          setIsSpeakingSource(true);
          setIsSpeakingTarget(false);
        } else {
          setIsSpeakingSource(false);
          setIsSpeakingTarget(true);
        }
      };
      
      utterance.onend = () => {
        if (isSource) {
          setIsSpeakingSource(false);
        } else {
          setIsSpeakingTarget(false);
        }
      };
      
      utterance.onerror = () => {
        if (isSource) {
          setIsSpeakingSource(false);
        } else {
          setIsSpeakingTarget(false);
        }
      };

      // 获取可用的语音
      const voices = window.speechSynthesis.getVoices();
      const availableVoice = voices.find(voice => voice.lang.toLowerCase().includes(utterance.lang.toLowerCase()));
      if (availableVoice) {
        utterance.voice = availableVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  const filterLanguages = (query: string) => {
    const allLanguages = [...languageGroups.common, ...languageGroups.asia];
    const lowerQuery = query.toLowerCase();
    return allLanguages.filter(lang => 
      lang.name.toLowerCase().includes(lowerQuery) || 
      getCountryName(lang.flag).toLowerCase().includes(lowerQuery)
    );
  };

  const getCountryName = (code: string) => {
    const countryNames: { [key: string]: string } = {
      'cn': '中国',
      'tw': '台湾',
      'us': '美国',
      'jp': '日本',
      'kr': '韩国',
      'fr': '法国',
      'de': '德国',
      'es': '西班牙',
      'ru': '俄罗斯',
      'sa': '沙特阿拉伯',
      'bd': '孟加拉国',
      'mm': '缅甸',
      'in': '印度',
      'id': '印度尼西亚',
      'th': '泰国',
      'vn': '越南'
    };
    return countryNames[code] || code.toUpperCase();
  };

  const handleMouseLeave = (type: 'source' | 'target') => {
    const isOverDropdown = dropdownRef.current?.matches(':hover');
    const isOverSourceSelect = sourceSelectRef.current?.matches(':hover');
    const isOverTargetSelect = targetSelectRef.current?.matches(':hover');

    if (!isOverDropdown && !isOverSourceSelect && !isOverTargetSelect) {
      if (type === 'source') {
        setShowSourceDropdown(false);
      } else {
        setShowTargetDropdown(false);
      }
    }
  };

  const handleCopy = async (text: string, isSource: boolean) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          textArea.remove();
        } catch (error) {
          console.error('复制失败:', error);
          textArea.remove();
          throw new Error('复制失败');
        }
      }
      if (isSource) {
        setShowSourceCopySuccess(true);
        setTimeout(() => setShowSourceCopySuccess(false), 2000);
      } else {
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('复制出错:', error);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2000);
    }
  };

  // 开始调整大小
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    if ('touches' in e) {
      resizeStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      resizeStartPos.current = { x: e.clientX, y: e.clientY };
    }
    initialSize.current = { width: canvasSize.width, height: canvasSize.height };
    e.currentTarget.setAttribute('data-resize-direction', direction);
  };

  // 调整大小
  const handleResize = (e: MouseEvent | TouchEvent) => {
    if (!isResizing) return;
    e.preventDefault();
    
    const currentPos = {
      x: 'touches' in e ? e.touches[0].clientX : e.clientX,
      y: 'touches' in e ? e.touches[0].clientY : e.clientY
    };
    
    const deltaX = currentPos.x - resizeStartPos.current.x;
    const deltaY = currentPos.y - resizeStartPos.current.y;
    const direction = document.querySelector('[data-resize-direction]')?.getAttribute('data-resize-direction');
    
    let newWidth = initialSize.current.width;
    let newHeight = initialSize.current.height;
    
    switch (direction) {
      case 'e':  // 右
        newWidth = Math.max(200, Math.min(800, initialSize.current.width + deltaX));
        break;
      case 'w':  // 左
        newWidth = Math.max(200, Math.min(800, initialSize.current.width + deltaX));
        break;
      case 'n':  // 上
        newHeight = Math.max(200, Math.min(800, initialSize.current.height + deltaY));
        break;
      case 's':  // 下
        newHeight = Math.max(200, Math.min(800, initialSize.current.height + deltaY));
        break;
    }
    
    setCanvasSize({ width: newWidth, height: newHeight });
    
    if (canvasRef.current) {
      canvasRef.current.width = newWidth * 2;
      canvasRef.current.height = newHeight * 2;
      canvasRef.current.style.width = `${newWidth}px`;
      canvasRef.current.style.height = `${newHeight}px`;
      
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.lineCap = 'round';
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        contextRef.current = context;
      }
    }
  };

  // 结束调整大小
  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // 添加调整大小的事件监听
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('touchmove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchend', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('touchmove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isResizing]);

  // 初始化画布
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 560;
      canvas.height = 560;
      canvas.style.width = '280px';
      canvas.style.height = '280px';

      const context = canvas.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.lineCap = 'round';
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        contextRef.current = context;
      }
    }
  };

  // 开始绘制（同时支持鼠标和触摸）
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (contextRef.current) {
      contextRef.current.beginPath();
      if ('touches' in e) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.touches[0].clientX - rect.left;
          const y = e.touches[0].clientY - rect.top;
          contextRef.current.moveTo(x, y);
        }
      } else {
        contextRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
      setIsDrawing(true);
    }
  };

  // 结束绘制
  const finishDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
      setIsDrawing(false);
    }
  };

  // 绘制（同时支持鼠标和触摸）
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    e.preventDefault();
    
    if ('touches' in e) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        contextRef.current.lineTo(x, y);
        contextRef.current.stroke();
      }
    } else {
      contextRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      contextRef.current.stroke();
    }
  };

  // 清除画布
  const clearCanvas = () => {
    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // 获取百度 OCR API 的 access token
  const getBaiduAccessToken = async (retryCount = 0): Promise<void> => {
    const token = process.env.REACT_APP_BAIDU_ACCESS_TOKEN;
    if (token) {
      console.log('获取access token成功');
      setBaiduAccessToken(token);
      return;
    }
    
    console.error('百度 API token 配置缺失');
    setRecognitionError('系统配置错误，请联系管理员');
    setTimeout(() => {
      setRecognitionError('');
    }, 3000);
  };

  useEffect(() => {
    getBaiduAccessToken();
  }, []);

  // 识别手写文字
  const recognizeHandwriting = async () => {
    if (!canvasRef.current) {
      setRecognitionError('画布未准备好，请重试');
      return;
    }

    if (!baiduAccessToken) {
      try {
        await getBaiduAccessToken();
        if (!process.env.REACT_APP_BAIDU_ACCESS_TOKEN) {
          return;
        }
      } catch (error) {
        setRecognitionError('系统未就绪，请刷新页面重试');
        return;
      }
    }

    setIsRecognizing(true);
    setRecognitionError('');

    try {
      // 获取 canvas 图像数据
      const imageData = canvasRef.current.toDataURL('image/png')
        .replace('data:image/png;base64,', '');

      // 构建请求参数
      const params = new URLSearchParams({
        access_token: baiduAccessToken,
        recognize_granularity: recognizeGranularity,
        probability: showProbability.toString(),
        detect_direction: detectDirection.toString(),
        detect_alteration: detectAlteration.toString(),
        language_type: handwritingLanguage,
      });

      // 调用百度手写文字识别 API
      const OCR_URL = process.env.REACT_APP_BAIDU_OCR_URL;
      if (!OCR_URL) {
        throw new Error('手写识别 API 地址未配置');
      }

      const response = await axios({
        method: 'post',
        url: `https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting?${params.toString()}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        data: `image=${encodeURIComponent(imageData)}`
      });

      console.log('识别结果:', response.data);

      if (!response.data.words_result || response.data.words_result.length === 0) {
        setRecognitionError('未能识别出文字，请书写更清晰或调整书写方向');
        setTimeout(() => {
          setRecognitionError('');
        }, 3000);
        return;
      }

      // 处理识别结果
      let recognizedText = '';
      
      response.data.words_result.forEach((result: any) => {
        recognizedText += result.words;
        
        if (showProbability && response.data.probability) {
          console.log(`行置信度 - 平均值: ${response.data.probability.average}, 最小值: ${response.data.probability.min}`);
        }
        
        if (recognizeGranularity === 'small' && result.chars) {
          console.log('单字符识别结果:', result.chars);
        }
      });

      // 如果检测到方向，输出方向信息
      if (detectDirection && response.data.direction !== undefined) {
        const directions = ['正向', '逆时针90度', '逆时针180度', '逆时针270度'];
        console.log('图像方向:', directions[response.data.direction] || '未定义');
      }
      
      setInputText((prev) => prev + recognizedText);
      clearCanvas();
    } catch (error: any) {
      console.error('手写识别失败:', error);
      const errorMessage = error.response?.data?.error_msg || error.message || '识别失败，请重试';
      setRecognitionError(errorMessage);
      
      // 3秒后清除错误提示
      setTimeout(() => {
        setRecognitionError('');
      }, 3000);
      
      if (error.response?.data?.error_code === 110 || error.response?.data?.error_code === 111) {
        setBaiduAccessToken('');
        await getBaiduAccessToken();
      }
    } finally {
      setIsRecognizing(false);
    }
  };

  // 修改手写功能处理
  const handleHandwriting = () => {
    setIsHandwriting(!isHandwriting);
    setRecognitionError('');
    if (!isHandwriting) {
      setPosition({
        x: Math.max(0, window.innerWidth / 2 - 160),
        y: Math.max(0, window.innerHeight / 2 - 200)
      });
      setTimeout(() => {
        initCanvas();
      }, 100);
    }
  };

  // 开始拖动
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    if ('touches' in e) {
      setDragOffset({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    } else {
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
    e.stopPropagation();
  };

  // 拖动中
  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;
    
    // 确保不会拖出屏幕
    const maxX = window.innerWidth - 320;
    const maxY = window.innerHeight - 400;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  // 结束拖动
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 添加拖动事件监听
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        handleDrag(e);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 初始化语音识别
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('语音识别已启动');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setInputText((prev) => prev + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        setIsListening(false);
        
        switch (event.error) {
          case 'not-allowed':
            setRecognitionError('语音升级中，请稍后再试');
            setIsListening(false);
            break;
          case 'audio-capture':
            setRecognitionError('语音升级中，请稍后再试');
            setIsListening(false);
            break;
          case 'network':
            setRecognitionError('语音升级中，请稍后再试');
            break;
          case 'no-speech':
            // 不显示这个错误，因为它经常在正常使用时触发
            console.log('未检测到语音');
            break;
          case 'aborted':
            console.log('语音识别已取消');
            break;
          default:
            setRecognitionError('语音升级中，请稍后再试');
            setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('语音识别已结束');
      };

      setSpeechRecognition(recognition);
    }
  }, []);

  // 优化移动端麦克风访问
  const initAudioAnalyser = async () => {
    try {
      // 检查浏览器是否支持 mediaDevices API
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        // 尝试使用旧版 API
        const oldGetUserMedia = (
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia
        )?.bind(navigator);

        if (oldGetUserMedia) {
          return new Promise((resolve, reject) => {
            oldGetUserMedia(
              { audio: true },
              (stream: MediaStream) => {
                mediaStream.current = stream;
                resolve(true);
              },
              (err: Error) => {
                console.error('麦克风访问错误:', err);
                reject(new Error('浏览器不支持麦克风访问，请使用最新版本的Chrome或Safari浏览器'));
              }
            );
          });
        }
      }

      // 检查权限状态
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'denied') {
          throw new Error('麦克风权限被拒绝，请在浏览器设置中允许网站访问麦克风');
        }
      } catch (err) {
        // 如果不支持 permissions API，继续尝试获取麦克风权限
        console.warn('权限检查失败，将直接尝试获取麦克风权限');
      }

      // 基础音频配置
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        }
      };

      try {
        // 主动请求麦克风权限
        mediaStream.current = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 创建音频上下文
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          throw new Error('您的浏览器不支持音频处理，请使用最新版本的浏览器');
        }
        
        audioContext.current = new AudioContext();
        analyser.current = audioContext.current.createAnalyser();
        
        const source = audioContext.current.createMediaStreamSource(mediaStream.current);
        source.connect(analyser.current);
        analyser.current.fftSize = 32;
        
        return true;
      } catch (err: any) {
        console.error('麦克风访问错误:', err);
        
        if (err.name === 'NotAllowedError') {
          throw new Error('请允许浏览器访问麦克风，或检查浏览器设置中的麦克风权限');
        } else if (err.name === 'NotFoundError') {
          throw new Error('未检测到麦克风设备，请确保设备已正确连接');
        } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
          throw new Error('麦克风被其他应用程序占用，请关闭其他使用麦克风的应用后重试');
        } else {
          throw new Error('无法访问麦克风，请确保设备已连接并重新授予权限');
        }
      }
    } catch (error: any) {
      console.error('音频初始化错误:', error);
      alert(error.message || '无法初始化麦克风，请检查浏览器设置和设备权限');
      return false;
    }
  };

  // 更新音频电平
  const updateAudioLevel = () => {
    if (!analyser.current || !isListening) return;
    
    const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
    analyser.current.getByteFrequencyData(dataArray);
    
    // 计算平均音量并添加一些随机波动使显示更自然
    const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
    const randomFactor = Math.sin(Date.now() / 200) * 5;
    setAudioLevel(Math.max(0, Math.min(255, average + randomFactor)));
    
    if (isListening) {
      animationFrame.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  // 清理音频资源
  useEffect(() => {
    return () => {
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop());
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  // 处理语音输入
  const handleSpeechInput = async () => {
    if (!isListening) {
      try {
        // 1. 检查浏览器兼容性
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
          setRecognitionError('您的浏览器不支持语音识别功能，请使用 Chrome 或 Safari 浏览器');
          return;
        }

        // 2. 主动请求麦克风权限
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          // 获取权限后立即停止音频流
          stream.getTracks().forEach(track => track.stop());
        } catch (err: any) {
          console.error('麦克风权限错误:', err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setRecognitionError('请在浏览器设置中允许访问麦克风');
          } else if (err.name === 'NotFoundError') {
            setRecognitionError('未检测到麦克风设备，请确保设备已正确连接');
          } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
            setRecognitionError('麦克风被其他应用程序占用，请关闭其他使用麦克风的应用后重试');
          } else {
            setRecognitionError('无法访问麦克风，请检查设备连接并重试');
          }
          setTimeout(() => setRecognitionError(''), 3000);
          return;
        }

        // 3. 初始化语音识别
        if (speechRecognition) {
          // 重置语音识别实例
          try {
            speechRecognition.abort();
            speechRecognition.stop();
          } catch (e) {
            console.log('重置语音识别实例');
          }
          
          // 配置语音识别参数
          speechRecognition.continuous = true;
          speechRecognition.interimResults = true;
          speechRecognition.lang = 'zh-CN';
          
          // 设置事件处理器
          speechRecognition.onstart = () => {
            setIsListening(true);
            setRecognitionError('语音识别已开启，请说话...');
            setTimeout(() => setRecognitionError(''), 2000);
          };

          speechRecognition.onend = () => {
            setIsListening(false);
            console.log('语音识别已结束');
          };

          speechRecognition.onerror = (event: any) => {
            console.error('语音识别错误:', event);
            
            switch (event.error) {
              case 'not-allowed':
                setRecognitionError('语音升级中，请稍后再试');
                setIsListening(false);
                break;
              case 'audio-capture':
                setRecognitionError('语音升级中，请稍后再试');
                setIsListening(false);
                break;
              case 'network':
                setRecognitionError('语音升级中，请稍后再试');
                break;
              case 'no-speech':
                // 不显示这个错误，因为它经常在正常使用时触发
                console.log('未检测到语音');
                break;
              case 'aborted':
                console.log('语音识别已取消');
                break;
              default:
                setRecognitionError('语音升级中，请稍后再试');
                setIsListening(false);
            }
            
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
              setTimeout(() => setRecognitionError(''), 3000);
            }
          };

          // 启动语音识别
          try {
            await speechRecognition.start();
          } catch (err: any) {
            if (err.message.includes('already started')) {
              speechRecognition.stop();
              setTimeout(() => speechRecognition.start(), 100);
            } else {
              throw err;
            }
          }
        }
      } catch (error: any) {
        console.error('语音识别错误:', error);
        setRecognitionError('语音识别初始化失败，请刷新页面重试');
        setIsListening(false);
        setTimeout(() => setRecognitionError(''), 3000);
      }
    } else {
      // 停止语音识别
      if (speechRecognition) {
        speechRecognition.stop();
        setIsListening(false);
        setRecognitionError('语音识别已停止');
        setTimeout(() => setRecognitionError(''), 2000);
      }
    }
  };

  // 添加历史记录点击处理函数
  const handleHistoryClick = () => {
    setShowHistory(!showHistory);
  };

  // 从历史记录加载翻译
  const loadFromHistory = (historyItem: typeof translationHistory[0]) => {
    setInputText(historyItem.sourceText);
    setTranslatedText(historyItem.translatedText);
    setSourceLang(historyItem.sourceLang);
    setTargetLang(historyItem.targetLang);
    setShowHistory(false);
  };

  // 清空所有历史记录
  const clearAllHistory = () => {
    setTranslationHistory([]);
    localStorage.removeItem('translationHistory');
  };

  // 删除单条历史记录
  const deleteHistoryItem = (timestamp: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = translationHistory.filter(item => item.timestamp !== timestamp);
    setTranslationHistory(newHistory);
    localStorage.setItem('translationHistory', JSON.stringify(newHistory));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-1 px-1 sm:py-6 sm:px-6 lg:px-8">
      {copyError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg shadow-lg text-sm flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>复制失败，请重试</span>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto min-w-[320px] flex flex-col">
        {/* 标题部分 */}
        <div className="text-center mb-1 sm:mb-4 flex-shrink-0">
          <div className="flex items-center justify-center mb-1 sm:mb-4">
            <svg className="w-6 h-6 sm:w-12 sm:h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-4xl font-bold text-gray-900 mb-0.5 sm:mb-2">智能翻译</h1>
          <p className="text-xs sm:text-lg text-gray-600 mb-0 sm:mb-1">支持多种语言的实时翻译服务</p>
          <p className="text-[10px] sm:text-xs text-gray-500">基于大语言模型的高性能翻译服务，使用DeepL API接口调用的大模型翻译</p>
        </div>

        {/* 翻译卡片 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 语言选择栏 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-6 py-1 sm:py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-3 sm:mb-0">
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <select
                    ref={sourceSelectRef}
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    onMouseEnter={() => setShowSourceDropdown(true)}
                    onMouseLeave={() => setTimeout(() => handleMouseLeave('source'), 100)}
                    className="block w-[7rem] sm:w-32 text-[12px] sm:text-sm pl-2 pr-8 py-2 border-0 bg-transparent focus:ring-0 focus:outline-none cursor-pointer appearance-none text-gray-900"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="auto" className="text-gray-900">自动检测</option>
                    <optgroup label="常用语言" className="text-gray-900 font-medium">
                      <option value="ZH">中文（简体）</option>
                      <option value="ZH-TW">中文（繁体）</option>
                      <option value="EN">英语</option>
                      <option value="JA">日语</option>
                      <option value="KO">韩语</option>
                      <option value="FR">法语</option>
                      <option value="DE">德语</option>
                      <option value="ES">西班牙语</option>
                      <option value="RU">俄语</option>
                      <option value="AR">阿拉伯语</option>
                    </optgroup>
                    <optgroup label="亚洲语言" className="text-gray-900 font-medium">
                      <option value="BN">孟加拉语</option>
                      <option value="MY">缅甸语</option>
                      <option value="GU">古吉拉特语</option>
                      <option value="HE">希伯来语</option>
                      <option value="HI">印地语</option>
                      <option value="ID">印尼语</option>
                      <option value="JV">爪哇语</option>
                      <option value="KN">卡纳达语</option>
                      <option value="KK">哈萨克语</option>
                      <option value="KM">高棉语</option>
                      <option value="LO">老挝语</option>
                      <option value="ML">马拉雅拉姆语</option>
                      <option value="MR">马拉地语</option>
                      <option value="MS">马来语</option>
                      <option value="NE">尼泊尔语</option>
                      <option value="PA">旁遮普语</option>
                      <option value="SI">僧伽罗语</option>
                      <option value="TA">泰米尔语</option>
                      <option value="TE">泰卢固语</option>
                      <option value="TH">泰语</option>
                      <option value="UR">乌尔都语</option>
                      <option value="UZ">乌兹别克语</option>
                      <option value="VI">越南语</option>
                      <option value="YUE">粤语</option>
                    </optgroup>
                    <optgroup label="欧洲语言" className="text-gray-900 font-medium">
                      <option value="BG">保加利亚语</option>
                      <option value="CS">捷克语</option>
                      <option value="DA">丹麦语</option>
                      <option value="EL">希腊语</option>
                      <option value="ET">爱沙尼亚语</option>
                      <option value="FI">芬兰语</option>
                      <option value="HU">匈牙利语</option>
                      <option value="IS">冰岛语</option>
                      <option value="IT">意大利语</option>
                      <option value="LT">立陶宛语</option>
                      <option value="LV">拉脱维亚语</option>
                      <option value="NL">荷兰语</option>
                      <option value="NO">挪威语</option>
                      <option value="PL">波兰语</option>
                      <option value="PT">葡萄牙语</option>
                      <option value="RO">罗马尼亚语</option>
                      <option value="SK">斯洛伐克语</option>
                      <option value="SL">斯洛文尼亚语</option>
                      <option value="SV">瑞典语</option>
                      <option value="UK">乌克兰语</option>
                    </optgroup>
                    <optgroup label="其他语言" className="text-gray-900 font-medium">
                      <option value="AF">南非荷兰语</option>
                      <option value="AM">阿姆哈拉语</option>
                      <option value="EU">巴斯克语</option>
                      <option value="BE">白俄罗斯语</option>
                      <option value="CA">加泰罗尼亚语</option>
                      <option value="EO">世界语</option>
                      <option value="FA">波斯语</option>
                      <option value="FY">弗里西语</option>
                      <option value="GA">爱尔兰语</option>
                      <option value="GD">苏格兰盖尔语</option>
                      <option value="GL">加利西亚语</option>
                      <option value="GN">瓜拉尼语</option>
                      <option value="HA">豪萨语</option>
                      <option value="HY">亚美尼亚语</option>
                      <option value="IG">伊博语</option>
                      <option value="KA">格鲁吉亚语</option>
                      <option value="KU">库尔德语</option>
                      <option value="KY">吉尔吉斯语</option>
                      <option value="LA">拉丁语</option>
                      <option value="LG">卢干达语</option>
                      <option value="MI">毛利语</option>
                      <option value="MN">蒙古语</option>
                      <option value="NY">齐切瓦语</option>
                      <option value="PS">普什图语</option>
                      <option value="RW">卢旺达语</option>
                      <option value="SA">梵语</option>
                      <option value="SO">索马里语</option>
                      <option value="SW">斯瓦希里语</option>
                      <option value="SN">修纳语</option>
                      <option value="TG">塔吉克语</option>
                      <option value="TI">提格里尼亚语</option>
                      <option value="TK">土库曼语</option>
                      <option value="TR">土耳其语</option>
                      <option value="UG">维吾尔语</option>
                      <option value="XH">科萨语</option>
                      <option value="YI">意第绪语</option>
                      <option value="YO">约鲁巴语</option>
                      <option value="ZU">祖鲁语</option>
                    </optgroup>
                  </select>
                  <div 
                    ref={dropdownRef}
                    className={`${showSourceDropdown || showTargetDropdown ? 'block' : 'hidden'} absolute left-0 top-full mt-1 py-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 language-dropdown`} 
                    style={{ width: 'max-content', minWidth: '400px' }}
                    onMouseEnter={() => {
                      if (showSourceDropdown) {
                        setShowSourceDropdown(true);
                      } else if (showTargetDropdown) {
                        setShowTargetDropdown(true);
                      }
                    }}
                    onMouseLeave={() => {
                      const isOverSourceSelect = sourceSelectRef.current?.matches(':hover');
                      const isOverTargetSelect = targetSelectRef.current?.matches(':hover');
                      if (!isOverSourceSelect && !isOverTargetSelect) {
                        setShowSourceDropdown(false);
                        setShowTargetDropdown(false);
                      }
                    }}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="搜索语言或国家..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 pl-8"
                        />
                        <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    {searchQuery ? (
                      <div className="px-4 py-2 max-h-[300px] overflow-y-auto">
                        <div className="grid grid-cols-3 gap-2">
                          {filterLanguages(searchQuery).map(lang => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                if (showSourceDropdown) {
                                  setSourceLang(lang.code);
                                } else {
                                  setTargetLang(lang.code);
                                }
                                setSearchQuery('');
                                setShowSourceDropdown(false);
                                setShowTargetDropdown(false);
                              }}
                              className={`px-2 py-1.5 text-left text-xs hover:bg-gray-100 flex items-center space-x-1.5 ${
                                showSourceDropdown ? (sourceLang === lang.code ? 'bg-gray-100' : '') : (targetLang === lang.code ? 'bg-gray-100' : '')
                              }`}
                            >
                              <span className="w-4 h-3 flex-shrink-0 rounded overflow-hidden">
                                <img src={`https://flagcdn.com/w20/${lang.flag}.png`} alt={lang.flag.toUpperCase()} className="w-full h-full object-cover" />
                              </span>
                              <span>{lang.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 px-4 py-2">
                        {showSourceDropdown && (
                          <button
                            onClick={() => {
                              setSourceLang('auto');
                              setSearchQuery('');
                              setShowSourceDropdown(false);
                            }}
                            className={`px-2 py-1.5 text-left text-xs hover:bg-gray-100 flex items-center space-x-1.5 ${
                              sourceLang === 'auto' ? 'bg-gray-100' : ''
                            }`}
                          >
                            <span className="w-4 h-3 flex-shrink-0 rounded overflow-hidden">
                              <svg className="w-4 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z M9.5 14.5c1.333-3.333 4.667-5 10-5" />
                              </svg>
                            </span>
                            <span>自动检测</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (showSourceDropdown) {
                              setSourceLang('ZH');
                            } else {
                              setTargetLang('ZH');
                            }
                            setSearchQuery('');
                            setShowSourceDropdown(false);
                            setShowTargetDropdown(false);
                          }}
                          className={`px-2 py-1.5 text-left text-xs hover:bg-gray-100 flex items-center space-x-1.5 ${
                            showSourceDropdown ? (sourceLang === 'ZH' ? 'bg-gray-100' : '') : (targetLang === 'ZH' ? 'bg-gray-100' : '')
                          }`}
                        >
                          <span className="w-4 h-3 flex-shrink-0 rounded overflow-hidden">
                            <img src="https://flagcdn.com/w20/cn.png" alt="CN" className="w-full h-full object-cover" />
                          </span>
                          <span>中文</span>
                        </button>
                        <button
                          onClick={() => {
                            if (showSourceDropdown) {
                              setSourceLang('EN');
                            } else {
                              setTargetLang('EN');
                            }
                            setSearchQuery('');
                            setShowSourceDropdown(false);
                            setShowTargetDropdown(false);
                          }}
                          className={`px-2 py-1.5 text-left text-xs hover:bg-gray-100 flex items-center space-x-1.5 ${
                            showSourceDropdown ? (sourceLang === 'EN' ? 'bg-gray-100' : '') : (targetLang === 'EN' ? 'bg-gray-100' : '')
                          }`}
                        >
                          <span className="w-4 h-3 flex-shrink-0 rounded overflow-hidden">
                            <img src="https://flagcdn.com/w20/us.png" alt="US" className="w-full h-full object-cover" />
                          </span>
                          <span>英语</span>
                        </button>
                        {!showSourceDropdown && (
                          <button
                            onClick={() => {
                              setTargetLang('JA');
                              setSearchQuery('');
                              setShowTargetDropdown(false);
                            }}
                            className={`px-2 py-1.5 text-left text-xs hover:bg-gray-100 flex items-center space-x-1.5 ${
                              targetLang === 'JA' ? 'bg-gray-100' : ''
                            }`}
                          >
                            <span className="w-4 h-3 flex-shrink-0 rounded overflow-hidden">
                              <img src="https://flagcdn.com/w20/jp.png" alt="JP" className="w-full h-full object-cover" />
                            </span>
                            <span>日语</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSwapLanguages}
                  className="p-1.5 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-all duration-200 border border-purple-200 bg-purple-50 relative"
                  title="交换源语言和目标语言"
                >
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12M20 7l-4-4m4 4l-4 4M16 17H4m0 0l4-4m-4 4l4 4" />
                  </svg>
                </button>
                <div className="relative group">
                  <select
                    ref={targetSelectRef}
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    onMouseEnter={() => setShowTargetDropdown(true)}
                    onMouseLeave={() => setTimeout(() => handleMouseLeave('target'), 100)}
                    className="block w-[7rem] sm:w-32 text-[12px] sm:text-sm pl-2 pr-8 py-2 border-0 bg-transparent focus:ring-0 focus:outline-none cursor-pointer appearance-none text-gray-900"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <optgroup label="常用语言" className="text-gray-900 font-medium">
                      <option value="ZH">中文（简体）</option>
                      <option value="ZH-TW">中文（繁体）</option>
                      <option value="EN">英语</option>
                      <option value="JA">日语</option>
                      <option value="KO">韩语</option>
                      <option value="FR">法语</option>
                      <option value="DE">德语</option>
                      <option value="ES">西班牙语</option>
                      <option value="RU">俄语</option>
                      <option value="AR">阿拉伯语</option>
                    </optgroup>
                    <optgroup label="亚洲语言" className="text-gray-900 font-medium">
                      <option value="BN">孟加拉语</option>
                      <option value="MY">缅甸语</option>
                      <option value="GU">古吉拉特语</option>
                      <option value="HE">希伯来语</option>
                      <option value="HI">印地语</option>
                      <option value="ID">印尼语</option>
                      <option value="JV">爪哇语</option>
                      <option value="KN">卡纳达语</option>
                      <option value="KK">哈萨克语</option>
                      <option value="KM">高棉语</option>
                      <option value="LO">老挝语</option>
                      <option value="ML">马拉雅拉姆语</option>
                      <option value="MR">马拉地语</option>
                      <option value="MS">马来语</option>
                      <option value="NE">尼泊尔语</option>
                      <option value="PA">旁遮普语</option>
                      <option value="SI">僧伽罗语</option>
                      <option value="TA">泰米尔语</option>
                      <option value="TE">泰卢固语</option>
                      <option value="TH">泰语</option>
                      <option value="UR">乌尔都语</option>
                      <option value="UZ">乌兹别克语</option>
                      <option value="VI">越南语</option>
                      <option value="YUE">粤语</option>
                    </optgroup>
                    <optgroup label="欧洲语言" className="text-gray-900 font-medium">
                      <option value="BG">保加利亚语</option>
                      <option value="CS">捷克语</option>
                      <option value="DA">丹麦语</option>
                      <option value="EL">希腊语</option>
                      <option value="ET">爱沙尼亚语</option>
                      <option value="FI">芬兰语</option>
                      <option value="HU">匈牙利语</option>
                      <option value="IS">冰岛语</option>
                      <option value="IT">意大利语</option>
                      <option value="LT">立陶宛语</option>
                      <option value="LV">拉脱维亚语</option>
                      <option value="NL">荷兰语</option>
                      <option value="NO">挪威语</option>
                      <option value="PL">波兰语</option>
                      <option value="PT">葡萄牙语</option>
                      <option value="RO">罗马尼亚语</option>
                      <option value="SK">斯洛伐克语</option>
                      <option value="SL">斯洛文尼亚语</option>
                      <option value="SV">瑞典语</option>
                      <option value="UK">乌克兰语</option>
                    </optgroup>
                    <optgroup label="其他语言" className="text-gray-900 font-medium">
                      <option value="AF">南非荷兰语</option>
                      <option value="AM">阿姆哈拉语</option>
                      <option value="EU">巴斯克语</option>
                      <option value="BE">白俄罗斯语</option>
                      <option value="CA">加泰罗尼亚语</option>
                      <option value="EO">世界语</option>
                      <option value="FA">波斯语</option>
                      <option value="FY">弗里西语</option>
                      <option value="GA">爱尔兰语</option>
                      <option value="GD">苏格兰盖尔语</option>
                      <option value="GL">加利西亚语</option>
                      <option value="GN">瓜拉尼语</option>
                      <option value="HA">豪萨语</option>
                      <option value="HY">亚美尼亚语</option>
                      <option value="IG">伊博语</option>
                      <option value="KA">格鲁吉亚语</option>
                      <option value="KU">库尔德语</option>
                      <option value="KY">吉尔吉斯语</option>
                      <option value="LA">拉丁语</option>
                      <option value="LG">卢干达语</option>
                      <option value="MI">毛利语</option>
                      <option value="MN">蒙古语</option>
                      <option value="NY">齐切瓦语</option>
                      <option value="PS">普什图语</option>
                      <option value="RW">卢旺达语</option>
                      <option value="SA">梵语</option>
                      <option value="SO">索马里语</option>
                      <option value="SW">斯瓦希里语</option>
                      <option value="SN">修纳语</option>
                      <option value="TG">塔吉克语</option>
                      <option value="TI">提格里尼亚语</option>
                      <option value="TK">土库曼语</option>
                      <option value="TR">土耳其语</option>
                      <option value="UG">维吾尔语</option>
                      <option value="XH">科萨语</option>
                      <option value="YI">意第绪语</option>
                      <option value="YO">约鲁巴语</option>
                      <option value="ZU">祖鲁语</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAutoTranslate(!isAutoTranslate)}
                className={`flex items-center px-2 py-1 rounded-md text-sm font-medium shadow-sm min-w-[70px] justify-center ${
                  isAutoTranslate 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent hover:from-indigo-700 hover:to-purple-700 transform hover:shadow-md'
                    : 'border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                } transition-all duration-200`}
                title={isAutoTranslate ? "点击关闭自动翻译" : "点击开启自动翻译"}
              >
                <svg className={`w-3 h-3 mr-1 ${isAutoTranslate ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                自动
              </button>
              <button
                onClick={translateText}
                disabled={isTranslating || !inputText || isAutoTranslate}
                className={`flex items-center px-2 py-1 rounded-md text-sm font-medium shadow-sm min-w-[70px] justify-center ${
                  isTranslating || !inputText || isAutoTranslate
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 border-transparent text-white hover:from-indigo-700 hover:to-purple-700 transform hover:shadow-md transition-all duration-200'
                }`}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                翻译
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* 输入区域 */}
            <div className="p-1 sm:p-4 flex flex-col h-auto relative">
              <textarea
                ref={inputRef}
                className={`flex-1 w-full text-base resize-none focus:outline-none focus:ring-0 focus:border-none outline-none min-h-[150px] sm:min-h-[250px] rounded-md ${
                  isTranslating ? 'cursor-not-allowed bg-gray-50' : ''
                }`}
                placeholder="请输入要翻译的文本..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isTranslating}
                style={{ outline: 'none' }}
              />
              <div className="flex justify-between items-center mt-1 sm:mt-2">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setInputText('')}
                    className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    title="清空文本"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={handleHistoryClick}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-full p-1 transition-all duration-200"
                    title="查看历史记录"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {inputText && (
                    <button
                      onClick={() => handleCopy(inputText, true)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-full p-1 transition-all duration-200"
                      title="复制原文"
                    >
                      {showSourceCopySuccess ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      )}
                    </button>
                  )}
                  {inputText && (
                    <button
                      onClick={() => handleSpeak(inputText, sourceLang, true)}
                      className={`text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-full p-1 transition-all duration-200 ${
                        isSpeakingSource ? 'text-indigo-600 bg-indigo-50' : ''
                      }`}
                      title={isSpeakingSource ? "点击停止朗读原文" : "朗读原文"}
                    >
                      <svg className={`w-4 h-4 ${isSpeakingSource ? 'text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={handleHandwriting}
                    className={`text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-full p-1 transition-all duration-200 ${
                      isHandwriting ? 'text-indigo-600' : ''
                    }`}
                    title="手写输入文本"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleSpeechInput}
                    className={`relative text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-full p-2 transition-all duration-200 ${
                      isListening ? 'text-indigo-600' : ''
                    }`}
                    title={isListening ? "点击停止语音输入" : "语音输入文本"}
                  >
                    <div className="relative flex items-center justify-center">
                      <svg className={`w-4 h-4 transition-colors duration-200 ${isListening ? 'text-indigo-600' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 23h8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {isListening && (
                        <div className="absolute inset-0">
                          <div className="absolute inset-0 rounded-full bg-indigo-100/80 animate-pulse-ring"></div>
                          <div className="absolute inset-0 rounded-full bg-indigo-200/50 animate-pulse-ring" style={{ animationDelay: '0.2s' }}></div>
                          <div className="absolute inset-0 rounded-full bg-indigo-300/30 animate-pulse-ring" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
                <span className="text-[11px] text-gray-400">{inputText.length}/5000</span>
              </div>

            </div>

            {/* 翻译结果区域 */}
            <div className="p-1 sm:p-4 flex flex-col h-auto relative">
              <textarea
                className={`flex-1 w-full text-base resize-none focus:outline-none focus:ring-0 focus:border-none outline-none min-h-[150px] sm:min-h-[250px] rounded-md ${
                  error && !swapError ? 'text-red-600' : 'text-gray-900'
                } ${isTranslating ? 'cursor-not-allowed bg-gray-100' : 'bg-gray-50'}`}
                value={error && !swapError ? error : (isTranslating ? '' : translatedText)}
                readOnly
                disabled={isTranslating}
                style={{ outline: 'none' }}
                placeholder="翻译"
              />
              <div className="flex justify-between items-center mt-1 sm:mt-2">
                <div className="flex items-center space-x-4">
                  {translatedText && (
                    <button
                      onClick={() => handleCopy(translatedText, false)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-full p-1 transition-all duration-200"
                      title="复制译文"
                    >
                      {showCopySuccess ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      )}
                    </button>
                  )}
                  {translatedText && (
                    <button
                      onClick={() => handleSpeak(translatedText, targetLang, false)}
                      className={`text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-full p-1 transition-all duration-200 ${
                        isSpeakingTarget ? 'text-indigo-600 bg-indigo-50' : ''
                      }`}
                      title={isSpeakingTarget ? "点击停止朗读译文" : "朗读译文"}
                    >
                      <svg className={`w-4 h-4 ${isSpeakingTarget ? 'text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  )}
                  {isTranslating ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-3 w-3 border-2 border-indigo-500 rounded-full border-t-transparent mr-1" />
                      <span className="text-[11px] text-indigo-600">正在翻译</span>
                    </div>
                  ) : (
                    translationTime > 0 && !error && (
                      <span className="text-[11px] text-gray-400">耗时: {translationTime}ms</span>
                    )
                  )}
                </div>
                <span className="text-[11px] text-gray-400">{translatedText.length}/5000</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="flex-shrink-0 pb-1 sm:pb-4">
          <div className="text-center text-sm text-gray-500 mt-4 mb-2">
            <div className="flex items-center justify-center space-x-4">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>实时翻译</span>
              <span className="mx-1">·</span>
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span>云端服务</span>
              <span className="mx-1">·</span>
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>准确度高</span>
            </div>
          </div>

          {/* API信息 */}
          <div className="text-center text-xs text-gray-400 mb-2">
            <p>© 2025 MowyAI翻译服务</p>
          </div>
        </div>

        {/* 手写输入弹出层 */}
        {isHandwriting && (
          <>
            <div
              ref={dialogRef}
              className="fixed bg-white rounded-lg p-4 shadow-2xl"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '320px',
                transform: 'none',
                cursor: isDragging ? 'grabbing' : 'default',
                zIndex: 41
              }}
            >
              {recognitionError && (
                <div 
                  className="fixed left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-200 text-red-600 px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap"
                  style={{
                    top: `${position.y - 40}px`,
                    zIndex: 9999
                  }}
                >
                  {recognitionError}
                </div>
              )}
              <div 
                className="flex justify-between items-center mb-3 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                <h3 className="text-base font-medium text-gray-900">手写输入</h3>
                <button
                  onClick={handleHandwriting}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-full p-1 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="border-2 border-gray-200 rounded-lg mb-3 bg-white relative">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={finishDrawing}
                  onMouseLeave={finishDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={finishDrawing}
                  className="touch-none cursor-crosshair"
                  style={{
                    width: '280px',
                    height: '280px',
                    touchAction: 'none'
                  }}
                />
              </div>
              
              {/* 识别选项 */}
              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-gray-600">识别语言：</label>
                  <select
                    value={handwritingLanguage}
                    onChange={(e) => setHandwritingLanguage(e.target.value)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                  >
                    <option value="auto_detect">自动检测</option>
                    <option value="CHN_ENG">中英文混合</option>
                    <option value="ENG">英文</option>
                    <option value="JAP">日语</option>
                    <option value="KOR">韩语</option>
                    <option value="FRE">法语</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-4 text-xs">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={recognizeGranularity === 'small'}
                      onChange={(e) => setRecognizeGranularity(e.target.checked ? 'small' : 'big')}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-200 h-3 w-3"
                    />
                    <span className="ml-1.5 text-gray-600">单字识别</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={showProbability}
                      onChange={(e) => setShowProbability(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-200 h-3 w-3"
                    />
                    <span className="ml-1.5 text-gray-600">显示置信度</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-4 text-xs">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={detectDirection}
                      onChange={(e) => setDetectDirection(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-200 h-3 w-3"
                    />
                    <span className="ml-1.5 text-gray-600">检测方向</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={detectAlteration}
                      onChange={(e) => setDetectAlteration(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-200 h-3 w-3"
                    />
                    <span className="ml-1.5 text-gray-600">检测涂改</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={clearCanvas}
                  className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition-all duration-200"
                >
                  清除画布
                </button>
                <button
                  onClick={() => {
                    if (inputText.length > 0 && inputRef.current) {
                      const cursorPos = inputRef.current.selectionStart;
                      if (cursorPos > 0) {
                        setInputText(inputText.slice(0, cursorPos - 1) + inputText.slice(cursorPos));
                        // 设置新的光标位置
                        setTimeout(() => {
                          if (inputRef.current) {
                            inputRef.current.selectionStart = cursorPos - 1;
                            inputRef.current.selectionEnd = cursorPos - 1;
                          }
                        }, 0);
                      }
                    }
                  }}
                  className="px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div className="flex-1" />
                <button
                  onClick={recognizeHandwriting}
                  disabled={isRecognizing}
                  className={`px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition-all duration-200 ${
                    isRecognizing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isRecognizing ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent mr-1"></div>
                      <span>识别中</span>
                    </div>
                  ) : '识别'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* 历史记录弹出层 */}
        {showHistory && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowHistory(false);
              }
            }}
          >
            <div className="bg-white rounded-lg p-4 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">翻译历史记录</h3>
                <div className="flex items-center space-x-2">
                  {translationHistory.length > 0 && (
                    <button
                      onClick={clearAllHistory}
                      className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200"
                    >
                      清空历史
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-full p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {translationHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    暂无翻译历史记录
                  </div>
                ) : (
                  <div className="space-y-3">
                    {translationHistory.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-200 relative group"
                      >
                        <div onClick={() => loadFromHistory(item)}>
                          <div className="text-sm text-gray-900 mb-1">{item.sourceText}</div>
                          <div className="text-sm text-gray-500">{item.translatedText}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteHistoryItem(item.timestamp, e)}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200"
                          title="删除此记录"
                        >
                          <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
