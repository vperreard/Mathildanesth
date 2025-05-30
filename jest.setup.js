// jest.setup.js - Configuration Jest stabilisée et optimisée
import '@testing-library/jest-dom';
import React from 'react';

// ===== MOCKS NEXT.JS =====
jest.mock('next/server', () => {
  const NextResponse = {
    json: jest.fn((data, init) => ({
      ok: true,
      status: init?.status || 200,
      statusText: 'OK',
      headers: new Map(Object.entries(init?.headers || {})),
      json: async () => data,
      text: async () => JSON.stringify(data),
      clone: function() { return this; },
      body: data,
      bodyUsed: false,
      url: '',
      type: 'basic',
      redirected: false,
    })),
    redirect: jest.fn((url, status = 302) => ({
      ok: false,
      status,
      statusText: 'Found',
      headers: new Map([['Location', url.toString()]]),
      json: async () => ({}),
      text: async () => '',
      clone: function() { return this; },
    })),
    next: jest.fn(() => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map(),
      json: async () => ({}),
      text: async () => '',
      clone: function() { return this; },
    })),
    error: jest.fn((message) => {
      throw new Error(message);
    }),
  };
  
  return {
    NextRequest: jest.fn().mockImplementation((url, init) => ({
      url,
      method: init?.method || 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      nextUrl: new URL(url),
    })),
    NextResponse,
  };
});

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ 
    push: jest.fn(), 
    replace: jest.fn(), 
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key) => {
      if (key === 'x-user-id') return '1';
      if (key === 'authorization') return 'Bearer mock-token';
      return null;
    }),
    has: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(() => []),
  })),
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn(() => []),
  })),
}));

jest.mock('next/font/google', () => ({
  Inter: () => ({ 
    className: 'mock-inter-font', 
    style: { fontFamily: 'mock-inter' } 
  }),
  Roboto_Mono: () => ({
    className: 'mock-roboto-mono-font',
    style: { fontFamily: 'mock-roboto-mono' },
  }),
  Montserrat: () => ({
    className: 'mock-montserrat-font',
    style: { fontFamily: 'mock-montserrat' },
  }),
}));

// ===== MOCKS BIBLIOTHÈQUES EXTERNES =====

// Framer Motion - Mock simplifié pour éviter les erreurs __rest
jest.mock('framer-motion', () => {
  const React = require('react');
  const createMotionComponent = (tag) => 
    React.forwardRef((props, ref) => {
      const { children, ...rest } = props;
      // Nettoyer les props spécifiques à framer-motion
      const { 
        initial, animate, exit, transition, variants, whileHover, 
        whileTap, whileFocus, whileInView, layoutId, layout, 
        ...htmlProps 
      } = rest;
      return require("react").createElement(tag, { ...htmlProps, ref }, children);
    });

  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
      nav: createMotionComponent('nav'),
      span: createMotionComponent('span'),
      section: createMotionComponent('section'),
      article: createMotionComponent('article'),
      aside: createMotionComponent('aside'),
      header: createMotionComponent('header'),
      footer: createMotionComponent('footer'),
      main: createMotionComponent('main'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      h4: createMotionComponent('h4'),
      h5: createMotionComponent('h5'),
      h6: createMotionComponent('h6'),
      p: createMotionComponent('p'),
      ul: createMotionComponent('ul'),
      ol: createMotionComponent('ol'),
      li: createMotionComponent('li'),
      a: createMotionComponent('a'),
      img: createMotionComponent('img'),
      form: createMotionComponent('form'),
      input: createMotionComponent('input'),
      textarea: createMotionComponent('textarea'),
      select: createMotionComponent('select'),
      option: createMotionComponent('option'),
      label: createMotionComponent('label'),
    },
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
      set: jest.fn(),
    }),
    useMotionValue: () => ({
      get: jest.fn(),
      set: jest.fn(),
      onChange: jest.fn(),
    }),
  };
});

// Lucide React - Mock dynamique pour toutes les icônes
jest.mock('lucide-react', () => {
  const React = require('react');
  const createIcon = (name) => React.forwardRef((props, ref) => 
    require("react").createElement('div', { 
      ...props, 
      ref, 
      'data-testid': `icon-${name.toLowerCase()}`,
      'data-icon': name 
    })
  );
  
  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return createIcon(prop);
      }
      return undefined;
    }
  });
});

// Socket.IO Client
jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    id: 'test-socket-id',
  })),
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    id: 'test-socket-id',
  })),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  QueryClient: jest.fn(() => ({
    clear: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}));

// Mock D3.js et d3-sankey
jest.mock('d3', () => {
  const mockSelection = {
    selectAll: jest.fn(() => mockSelection),
    select: jest.fn(() => mockSelection),
    data: jest.fn(() => mockSelection),
    enter: jest.fn(() => mockSelection),
    append: jest.fn(() => mockSelection),
    attr: jest.fn(() => mockSelection),
    style: jest.fn(() => mockSelection),
    text: jest.fn(() => mockSelection),
    on: jest.fn(() => mockSelection),
    remove: jest.fn(() => mockSelection),
    call: jest.fn(() => mockSelection),
  };

  return {
    select: jest.fn(() => mockSelection),
    selectAll: jest.fn(() => mockSelection),
    rgb: jest.fn(() => ({
      darker: jest.fn(() => 'darker-color'),
      brighter: jest.fn(() => 'brighter-color'),
      toString: jest.fn(() => '#000000'),
    })),
    scaleOrdinal: jest.fn(() => jest.fn()),
    scaleLinear: jest.fn(() => jest.fn()),
    schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c'],
    interpolate: jest.fn(),
    extent: jest.fn(),
    max: jest.fn(),
    min: jest.fn(),
  };
});

jest.mock('d3-sankey', () => ({
  sankey: jest.fn(() => {
    // Créer l'objet Sankey avec méthodes chainables
    const sankeyInstance = {
      nodeWidth: jest.fn(function() { return this; }),
      nodePadding: jest.fn(function() { return this; }),
      extent: jest.fn(function() { return this; }),
      size: jest.fn(function() { return this; }),
      nodes: jest.fn(function() { return this; }),
      links: jest.fn(function() { return this; }),
      layout: jest.fn(function(iterations) { return this; }),
      relax: jest.fn(function() { return this; }),
    };
    
    // Fonction callable qui traite les données
    const sankeyFunction = jest.fn((data) => ({
      nodes: data.nodes.map((node, i) => ({
        ...node,
        index: i,
        x0: i * 100,
        x1: i * 100 + 15,
        y0: 0,
        y1: 50,
      })),
      links: data.links.map((link) => ({
        ...link,
        width: link.value,
        y0: 0,
        y1: link.value,
      })),
    }));
    
    // Copier les méthodes sur la fonction
    Object.assign(sankeyFunction, sankeyInstance);
    
    return sankeyFunction;
  }),
  sankeyLinkHorizontal: jest.fn(() => jest.fn(() => 'M0,0L100,0')),
}));

// Mock date-fns with proper formatting and all required functions
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    const d = new Date(date);
    if (formatStr === 'dd/MM/yyyy') {
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return d.toISOString().split('T')[0]; // Default to yyyy-MM-dd
  }),
  parseISO: jest.fn((dateStr) => new Date(dateStr)),
  isValid: jest.fn(() => true),
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  subDays: jest.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  startOfWeek: jest.fn((date) => date),
  endOfWeek: jest.fn((date) => date),
  startOfMonth: jest.fn((date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }),
  endOfMonth: jest.fn((date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }),
  isSameDay: jest.fn(() => false),
  isToday: jest.fn(() => false),
  getYear: jest.fn((date) => new Date(date).getFullYear()),
  getMonth: jest.fn((date) => new Date(date).getMonth()),
  getDate: jest.fn((date) => new Date(date).getDate()),
  getDay: jest.fn((date) => new Date(date).getDay()),
  differenceInDays: jest.fn((end, start) => {
    const diffTime = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }),
  isWeekend: jest.fn((date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }),
  setYear: jest.fn((date, year) => {
    const newDate = new Date(date);
    newDate.setFullYear(year);
    return newDate;
  }),
  setMonth: jest.fn((date, month) => {
    const newDate = new Date(date);
    newDate.setMonth(month);
    return newDate;
  }),
  setDate: jest.fn((date, day) => {
    const newDate = new Date(date);
    newDate.setDate(day);
    return newDate;
  }),
}));

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    formState: { errors: {} },
    setValue: jest.fn(),
    getValues: jest.fn(() => ({})),
    watch: jest.fn(),
    reset: jest.fn(),
  })),
  Controller: ({ render }) => render({ field: {}, fieldState: {}, formState: {} }),
}));

// Mock Zod with comprehensive method chaining support
jest.mock('zod', () => {
  const createMockZodType = () => {
    const mockType = {
      min: jest.fn(() => mockType),
      max: jest.fn(() => mockType),
      email: jest.fn(() => mockType),
      optional: jest.fn(() => mockType),
      nullable: jest.fn(() => mockType),
      default: jest.fn(() => mockType),
      refine: jest.fn(() => mockType),
      transform: jest.fn(() => mockType),
      int: jest.fn(() => mockType),
      positive: jest.fn(() => mockType),
      negative: jest.fn(() => mockType),
      nonnegative: jest.fn(() => mockType),
      nonpositive: jest.fn(() => mockType),
      finite: jest.fn(() => mockType),
      safe: jest.fn(() => mockType),
      length: jest.fn(() => mockType),
      includes: jest.fn(() => mockType),
      startsWith: jest.fn(() => mockType),
      endsWith: jest.fn(() => mockType),
      regex: jest.fn(() => mockType),
      url: jest.fn(() => mockType),
      uuid: jest.fn(() => mockType),
      cuid: jest.fn(() => mockType),
      datetime: jest.fn(() => mockType),
      parse: jest.fn(),
      safeParse: jest.fn(() => ({ success: true, data: {} })),
    };
    return mockType;
  };

  return {
    z: {
      object: jest.fn(() => createMockZodType()),
      string: jest.fn(() => createMockZodType()),
      number: jest.fn(() => createMockZodType()),
      boolean: jest.fn(() => createMockZodType()),
      array: jest.fn(() => createMockZodType()),
      enum: jest.fn(() => createMockZodType()),
      date: jest.fn(() => createMockZodType()),
      union: jest.fn(() => createMockZodType()),
      literal: jest.fn(() => createMockZodType()),
      any: jest.fn(() => createMockZodType()),
      unknown: jest.fn(() => createMockZodType()),
      void: jest.fn(() => createMockZodType()),
      null: jest.fn(() => createMockZodType()),
      undefined: jest.fn(() => createMockZodType()),
      record: jest.fn(() => createMockZodType()),
      tuple: jest.fn(() => createMockZodType()),
      map: jest.fn(() => createMockZodType()),
      set: jest.fn(() => createMockZodType()),
      promise: jest.fn(() => createMockZodType()),
      function: jest.fn(() => createMockZodType()),
      instanceof: jest.fn(() => createMockZodType()),
      lazy: jest.fn(() => createMockZodType()),
      nativeEnum: jest.fn(() => createMockZodType()),
    },
  };
});

// ===== MOCKS RADIX UI =====
const createRadixMock = (elements) => {
  const mocks = {};
  Object.keys(elements).forEach(key => {
    mocks[key] = ({ children, ...props }) => {
      const Element = elements[key];
      return require("react").createElement(Element, props, children);
    };
  });
  return mocks;
};

const radixComponents = {
  '@radix-ui/react-accordion': {
    Root: 'div', Item: 'div', Header: 'div', Trigger: 'button', Content: 'div'
  },
  '@radix-ui/react-alert-dialog': {
    Root: 'div', Trigger: 'button', Portal: 'div', Overlay: 'div', 
    Content: 'div', Title: 'h2', Description: 'p', Action: 'button', Cancel: 'button'
  },
  '@radix-ui/react-avatar': {
    Root: 'div', Image: 'img', Fallback: 'div'
  },
  '@radix-ui/react-checkbox': {
    Root: 'div', Indicator: 'div'
  },
  '@radix-ui/react-dialog': {
    Root: 'div', Trigger: 'button', Portal: 'div', Overlay: 'div',
    Content: 'div', Title: 'h2', Description: 'p', Close: 'button'
  },
  '@radix-ui/react-dropdown-menu': {
    Root: 'div', Trigger: 'button', Portal: 'div', Content: 'div',
    Item: 'div', CheckboxItem: 'div', RadioItem: 'div', Label: 'div',
    Separator: 'div', Arrow: 'div', Sub: 'div', SubTrigger: 'div', SubContent: 'div'
  },
  '@radix-ui/react-label': {
    Root: 'label'
  },
  '@radix-ui/react-popover': {
    Root: 'div', Trigger: 'button', Portal: 'div', Content: 'div', Arrow: 'div', Close: 'button'
  },
  '@radix-ui/react-progress': {
    Root: 'div', Indicator: 'div'
  },
  '@radix-ui/react-radio-group': {
    Root: 'div', Item: 'button', Indicator: 'div'
  },
  '@radix-ui/react-scroll-area': {
    Root: 'div', Viewport: 'div', Scrollbar: 'div', Thumb: 'div', Corner: 'div'
  },
  '@radix-ui/react-select': {
    Root: 'div', Trigger: 'button', Value: 'span', Icon: 'span', Portal: 'div',
    Content: 'div', Viewport: 'div', Item: 'div', ItemText: 'span', 
    ItemIndicator: 'span', ScrollUpButton: 'button', ScrollDownButton: 'button',
    Group: 'div', Label: 'label', Separator: 'div', Arrow: 'div'
  },
  '@radix-ui/react-separator': {
    Root: 'div'
  },
  '@radix-ui/react-slider': {
    Root: 'div', Track: 'div', Range: 'div', Thumb: 'div'
  },
  '@radix-ui/react-slot': {
    Slot: 'div', Slottable: 'div'
  },
  '@radix-ui/react-switch': {
    Root: 'button', Thumb: 'div'
  },
  '@radix-ui/react-tabs': {
    Root: 'div', List: 'div', Trigger: 'button', Content: 'div'
  },
  '@radix-ui/react-toast': {
    Root: 'div', Title: 'h3', Description: 'p', Action: 'button', 
    Close: 'button', Viewport: 'div', Provider: 'div'
  },
  '@radix-ui/react-tooltip': {
    Root: 'div', Trigger: 'div', Portal: 'div', Content: 'div', 
    Arrow: 'div', Provider: 'div'
  },
};

// Apply Radix UI mocks - Fixed scope issues
jest.mock('@radix-ui/react-accordion', () => ({
  Root: ({ children, ...props }) => require("react").createElement('div', props, children),
  Item: ({ children, ...props }) => require("react").createElement('div', props, children),
  Header: ({ children, ...props }) => require("react").createElement('div', props, children),
  Trigger: ({ children, ...props }) => require("react").createElement('button', props, children),
  Content: ({ children, ...props }) => require("react").createElement('div', props, children),
}));

jest.mock('@radix-ui/react-alert-dialog', () => ({
  Root: ({ children, ...props }) => require("react").createElement('div', props, children),
  Trigger: ({ children, ...props }) => require("react").createElement('button', props, children),
  Portal: ({ children, ...props }) => require("react").createElement('div', props, children),
  Overlay: ({ children, ...props }) => require("react").createElement('div', props, children),
  Content: ({ children, ...props }) => require("react").createElement('div', props, children),
  Title: ({ children, ...props }) => require("react").createElement('h2', props, children),
  Description: ({ children, ...props }) => require("react").createElement('p', props, children),
  Action: ({ children, ...props }) => require("react").createElement('button', props, children),
  Cancel: ({ children, ...props }) => require("react").createElement('button', props, children),
}));

jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, ...props }) => require("react").createElement('div', props, children),
  Trigger: ({ children, ...props }) => require("react").createElement('button', props, children),
  Portal: ({ children, ...props }) => require("react").createElement('div', props, children),
  Overlay: ({ children, ...props }) => require("react").createElement('div', props, children),
  Content: ({ children, ...props }) => require("react").createElement('div', props, children),
  Title: ({ children, ...props }) => require("react").createElement('h2', props, children),
  Description: ({ children, ...props }) => require("react").createElement('p', props, children),
  Close: ({ children, ...props }) => require("react").createElement('button', props, children),
}));

// Mock dropdown menu skipped as package not installed

jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children, ...props }) => require("react").createElement('div', props, children),
  Trigger: ({ children, ...props }) => require("react").createElement('button', props, children),
  Value: ({ children, ...props }) => require("react").createElement('span', props, children),
  Icon: ({ children, ...props }) => require("react").createElement('span', props, children),
  Portal: ({ children, ...props }) => require("react").createElement('div', props, children),
  Content: ({ children, ...props }) => require("react").createElement('div', props, children),
  Viewport: ({ children, ...props }) => require("react").createElement('div', props, children),
  Item: ({ children, ...props }) => require("react").createElement('div', props, children),
  ItemText: ({ children, ...props }) => require("react").createElement('span', props, children),
  ItemIndicator: ({ children, ...props }) => require("react").createElement('span', props, children),
  ScrollUpButton: ({ children, ...props }) => require("react").createElement('button', props, children),
  ScrollDownButton: ({ children, ...props }) => require("react").createElement('button', props, children),
  Group: ({ children, ...props }) => require("react").createElement('div', props, children),
  Label: ({ children, ...props }) => require("react").createElement('label', props, children),
  Separator: ({ children, ...props }) => require("react").createElement('div', props, children),
  Arrow: ({ children, ...props }) => require("react").createElement('div', props, children),
}));

jest.mock('@radix-ui/react-tooltip', () => ({
  Root: ({ children, ...props }) => require("react").createElement('div', props, children),
  Trigger: ({ children, ...props }) => require("react").createElement('div', props, children),
  Portal: ({ children, ...props }) => require("react").createElement('div', props, children),
  Content: ({ children, ...props }) => require("react").createElement('div', props, children),
  Arrow: ({ children, ...props }) => require("react").createElement('div', props, children),
  Provider: ({ children, ...props }) => require("react").createElement('div', props, children),
}));

// ===== MOCKS SERVICES INTERNES =====

// Prisma mock centralisé
jest.mock('@/lib/prisma', () => {
  const createMockModel = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    createMany: jest.fn().mockResolvedValue({ count: 1 }),
    update: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    upsert: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    delete: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockResolvedValue([]),
  });
  
  const mockPrisma = {
    // Modèles principaux
    leave: createMockModel(),
    user: createMockModel(),
    assignment: createMockModel(),
    site: createMockModel(),
    operatingRoom: createMockModel(),
    specialty: createMockModel(),
    userSkill: createMockModel(),
    trameAffectation: createMockModel(),
    trameModele: createMockModel(),
    activityType: createMockModel(),
    department: createMockModel(),
    leaveType: createMockModel(),
    leaveQuota: createMockModel(),
    recurringLeave: createMockModel(),
    conflictDetectionRule: createMockModel(),
    auditLog: createMockModel(),
    notification: createMockModel(),
    notificationPreference: createMockModel(),
    operatingSector: createMockModel(),
    operatingRoomType: createMockModel(),
    sectorCategory: createMockModel(),
    
    // Méthodes Prisma
    $transaction: jest.fn((fn) => {
      if (typeof fn === 'function') {
        return fn(mockPrisma);
      }
      return Promise.resolve(fn);
    }),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $executeRaw: jest.fn().mockResolvedValue(1),
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    $queryRaw: jest.fn().mockResolvedValue([]),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
  };
  
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

// Services critiques mockés
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn().mockResolvedValue({ userId: 1, role: 'USER' }),
  generateToken: jest.fn().mockReturnValue('mock-token'),
  validateSession: jest.fn().mockResolvedValue(true),
  getUserFromCookie: jest.fn().mockResolvedValue({ id: 1, role: 'USER' }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/modules/leaves/services/publicHolidayService', () => ({
  publicHolidayService: {
    getPublicHolidaysInRange: jest.fn().mockResolvedValue([]),
    isPublicHoliday: jest.fn().mockResolvedValue(false),
    getPublicHolidaysForYear: jest.fn().mockResolvedValue([]),
    parseDate: jest.fn().mockImplementation((dateStr) => new Date(dateStr)),
    formatDate: jest.fn().mockImplementation((date) => date.toISOString().split('T')[0]),
    preloadData: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/PerformanceMonitoringService', () => ({
  PerformanceMonitoringService: {
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    recordMetric: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
  },
}));

// Mock utils/apiClient centralisé
jest.mock('@/utils/apiClient', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: {}, status: 200, statusText: 'OK' }),
    post: jest.fn().mockResolvedValue({ data: {}, status: 201, statusText: 'Created' }),
    put: jest.fn().mockResolvedValue({ data: {}, status: 200, statusText: 'OK' }),
    patch: jest.fn().mockResolvedValue({ data: {}, status: 200, statusText: 'OK' }),
    delete: jest.fn().mockResolvedValue({ data: {}, status: 204, statusText: 'No Content' }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

// ===== MSW SETUP =====
// Note: MSW setup moved to avoid scoping issues with beforeAll/afterAll in global scope
try {
  const { server } = require('./src/tests/mocks/server');
  // Make server available globally for tests that need it
  global.__MSW_SERVER__ = server;
} catch (error) {
  console.warn('MSW server not available, tests will run without API mocking');
}

// ===== MOCKS ENVIRONMENT =====

// Mock window et DOM globals pour éviter les erreurs côté serveur
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock performance API
if (typeof window !== 'undefined') {
  window.performance = window.performance || {
    mark: jest.fn(),
    measure: jest.fn(),
    now: jest.fn(() => Date.now()),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
  };
}

// Mock localStorage et sessionStorage
const createStorage = () => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
};

Object.defineProperty(window, 'localStorage', { value: createStorage() });
Object.defineProperty(window, 'sessionStorage', { value: createStorage() });

// ===== SETUP GLOBAL =====

// Configuration des tests
jest.setTimeout(10000);

// Suppression des warnings non pertinents
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: An update to') ||
     args[0].includes('Warning: validateDOMNesting') ||
     args[0].includes('Warning: Received') ||
     args[0].includes('Warning: Cannot update a component') ||
     args[0].includes('[MSW]') ||
     args[0].includes('Could not load canvas') ||
     args[0].includes('Warning: React does not recognize') ||
     args[0].includes('forwardRef render functions') ||
     args[0].includes('Warning: React.createFactory'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Enums globaux pour éviter les erreurs d'import
global.TemplatePattern = {
  QUOTIDIEN: 'QUOTIDIEN',
  HEBDOMADAIRE: 'HEBDOMADAIRE', 
  MENSUEL: 'MENSUEL',
  SPECIFIQUE: 'SPECIFIQUE'
};

global.FrequencyType = {
  QUOTIDIENNE: 'QUOTIDIENNE',
  HEBDOMADAIRE: 'HEBDOMADAIRE',
  MENSUELLE: 'MENSUELLE',
  PERSONNALISEE: 'PERSONNALISEE'
};

// Setup des mocks utilitaires si disponible
try {
  const { setupAllMocks } = require('./src/test-utils/setupTests');
  const { setupAllCommonMocks, defaultJestSetup } = require('./src/test-utils/standardMocks');
  
  setupAllMocks();
  defaultJestSetup();
  setupAllCommonMocks();
} catch (error) {
  console.warn('Test utilities not fully available, using basic setup');
}

console.log('jest.setup.js loaded and all mocks configured.');