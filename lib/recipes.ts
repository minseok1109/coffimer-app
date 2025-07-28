export interface RecipeStep {
  time: number;
  title: string;
  description: string;
  water: string;
  totalWater?: number;
}

export interface Recipe {
  id: number;
  name: string;
  totalTime: number;
  coffee: string;
  water: string;
  ratio: string;
  filter?: string;
  waterTemperature: string;
  dripper: string;
  description: string;
  image: string;
  youtubeUrl?: string;
  steps?: RecipeStep[];
}

export const recipes: Recipe[] = [
  {
    id: 0,
    name: '테츠 카츠야 4:6 레시피',
    totalTime: 210,
    coffee: '20g',
    water: '300ml',
    waterTemperature: '92°C',
    dripper: 'V60',
    ratio: '1:15',
    description:
      '일본의 유명 바리스타 테츠 카츠야가 개발한 클래식한 V60 레시피입니다. 균형잡힌 맛과 깔끔한 후미가 특징입니다.',
    image: '/api/placeholder/300/200',
    youtubeUrl: 'https://youtu.be/ewqza63GXh0?si=UKTU1rZFZF0y5ZXQ',
    steps: [
      {
        time: 45,
        title: '블루밍',
        description: '커피 가루에 물을 적셔 45초간 기다리세요',
        water: '70ml',
        totalWater: 70,
      },
      {
        time: 90,
        title: '1차 추출',
        description: '천천히 원을 그리며 물을 부어주세요',
        water: '50ml',
        totalWater: 120,
      },
      {
        time: 135,
        title: '2차 추출',
        description: '중앙에서 바깥쪽으로 물을 부어주세요',
        water: '60ml',
        totalWater: 180,
      },
      {
        time: 180,
        title: '3차 추출',
        description: '천천히 원을 그리며 물을 부어주세요',
        water: '60ml',
        totalWater: 240,
      },
      {
        time: 210,
        title: '완료',
        description: '모든 물이 떨어질 때까지 기다리세요',
        water: '60ml',
        totalWater: 300,
      },
    ],
  },
  {
    id: 1,
    name: '안스타 6888 레시피',
    totalTime: 150,
    coffee: '20g',
    water: '300ml',
    ratio: '1:15',
    waterTemperature: '94°C',
    dripper: 'V60',
    description:
      '안스타님의 6888 레시피입니다. 굵은 분쇄도를 사용해서 향미를 표현한게 특징인 레시피입니다.',
    image: '/api/placeholder/300/200',
    youtubeUrl: 'https://youtu.be/uZs78TPm7ws?si=FUqhmbGwAHV7DjdW',
    steps: [
      {
        time: 30,
        title: '블루밍',
        description: '커피 가루를 충분히 적셔주세요',
        water: '60ml',
        totalWater: 60,
      },
      {
        time: 60,
        title: '1차 추출',
        description: '물이 다 빠질 때까지 기다리세요.',
        water: '80ml',
        totalWater: 140,
      },
      {
        time: 90,
        title: '2차 추출',
        description: '물이 다 빠질 때까지 기다리세요.',
        water: '80ml',
        totalWater: 220,
      },
      {
        time: 120,
        title: '3차 추출',
        description: '물이 다 빠질 때까지 기다리세요.',
        water: '80ml',
        totalWater: 300,
      },
      {
        time: 150,
        title: '완료',
        description: '모든 물이 떨어질 때까지 기다리세요.',
        water: '0ml',
        totalWater: 300,
      },
    ],
  },
  {
    id: 2,
    name: '정인성 4666 레시피 (오리지널)',
    totalTime: 140,
    coffee: '20g',
    water: '320ml',
    ratio: '1:11',
    waterTemperature: '90°C',
    dripper: 'V60',
    description:
      '정인성 바리스타의 대표 레시피로 40g-60g-60g-60g으로 분할 추출합니다. 약배전 스페셜티 원두의 맛과 향을 표현하는 데 적합합니다.',
    image: '/api/placeholder/300/200',
    youtubeUrl: 'https://youtu.be/ewGLBdY6KOo?si=cmkTpc8TudPQlMNc',
    steps: [
      {
        time: 30,
        title: '뜸들이기',
        description: '원두 가루 전체를 부드럽게 적십니다.',
        water: '40ml',
        totalWater: 40,
      },
      {
        time: 60,
        title: '1차 추출',
        description: '중앙부터 바깥쪽으로 원을 그리며 붓습니다.',
        water: '60ml',
        totalWater: 100,
      },
      {
        time: 90,
        title: '2차 추출',
        description: '1차와 동일한 방식으로 붓습니다.',
        water: '60ml',
        totalWater: 160,
      },
      {
        time: 130,
        title: '3차 추출',
        description: '마지막 물을 붓고 추출을 마칩니다.',
        water: '60ml',
        totalWater: 220,
      },
      {
        time: 140,
        title: '희석',
        description: '추출된 원액에 뜨거운 물을 부어 농도를 조절합니다.',
        water: '100ml',
        totalWater: 320,
      },
    ],
  },
  {
    id: 3,
    name: '정인성 국룰 레시피 Ver 2.0 (HOT)',
    totalTime: 170,
    coffee: '18g',
    water: '300ml',
    ratio: '1:16',
    waterTemperature: '90°C',
    dripper: 'V60',
    description:
      '기존 4666 레시피의 개선 버전으로, 뜸들이기 시간을 늘려 안정성을 높였습니다.',
    image: '/api/placeholder/300/200',
    youtubeUrl: 'https://youtu.be/i7Q-pvahrXw?si=5tcZ4azNWHNXFL8j',
    steps: [
      {
        time: 40,
        title: '뜸들이기',
        description: '40초간 충분히 뜸을 들여 가스를 배출합니다.',
        water: '40ml',
        totalWater: 40,
      },
      {
        time: 70,
        title: '1차 추출',
        description: '30초 동안 붓습니다.',
        water: '60ml',
        totalWater: 100,
      },
      {
        time: 100,
        title: '2차 추출',
        description: '30초 동안 붓습니다.',
        water: '60ml',
        totalWater: 160,
      },
      {
        time: 150,
        title: '3차 추출',
        description: '마지막 물을 붓고 추출을 완료합니다.',
        water: '60ml',
        totalWater: 220,
      },
      {
        time: 170,
        title: '희석',
        description: '추출된 원액에 뜨거운 물을 부어 농도를 조절합니다.',
        water: '80ml',
        totalWater: 300,
      },
    ],
  },
  {
    id: 4,
    name: '정인성 국룰 레시피 Ver 2.0 (ICED)',
    totalTime: 170,
    coffee: '18g',
    water: '200ml',
    ratio: '1:11',
    waterTemperature: '90°C',
    dripper: 'V60',
    description:
      '아이스 커피를 위해 고안된 레시피. 마지막 물 양을 줄여 진한 원액을 추출한 뒤 얼음에 바로 부어 완성합니다.',
    image: '/api/placeholder/300/200',
    youtubeUrl: 'https://youtu.be/i7Q-pvahrXw?si=5tcZ4azNWHNXFL8j',
    steps: [
      {
        time: 40,
        title: '뜸들이기',
        description: '40초간 충분히 뜸을 들입니다.',
        water: '40ml',
        totalWater: 40,
      },
      {
        time: 70,
        title: '1차 추출',
        description: '30초 동안 붓습니다.',
        water: '60ml',
        totalWater: 100,
      },
      {
        time: 100,
        title: '2차 추출',
        description: '30초 동안 붓습니다.',
        water: '60ml',
        totalWater: 160,
      },
      {
        time: 170,
        title: '3차 추출',
        description: '마지막 물 양을 줄여 진하게 추출합니다.',
        water: '40ml',
        totalWater: 200,
      },
    ],
  },
  {
    id: 5,
    name: '정인성 아이스 드립 레시피',
    totalTime: 140,
    coffee: '15g',
    water: '150ml',
    ratio: '1:10',
    waterTemperature: '95°C 이상',
    dripper: 'V60 (모든 드리퍼 가능)',
    description:
      '기본 1:10 비율로 진하게는 1:9, 연하게는 1:11 비율로 추출합니다.',
    image: '/api/placeholder/300/200',
    youtubeUrl: 'https://www.youtube.com/watch?v=x2ifNAQAET0',
    steps: [
      {
        time: 45,
        title: '뜸들이기',
        description: '45초간 충분히 뜸을 들입니다.',
        water: '50ml',
        totalWater: 50,
      },
      {
        time: 90,
        title: '1차 추출',
        description:
          '45초 동안 붓습니다. (1차 추출과 2차 추출 사이에 물이 다 빠져도 괜찮습니다)',
        water: '50ml',
        totalWater: 100,
      },
      {
        time: 135,
        title: '2차 추출',
        description: '45초 동안 붓습니다. ',
        water: '50ml',
        totalWater: 150,
      },
    ],
  },
  {
    id: 6,
    name: '용챔 약배전 레시피',
    totalTime: 140,
    coffee: '15g',
    water: '240ml',
    ratio: '1:16',
    waterTemperature: '95°C',
    dripper: 'V60',
    description:
      '커피 전문 유튜버 용챔의 약배전 원두 전용 레시피입니다. 굵고 빠른 물줄기로 시작하여 후반부에는 가늘고 느린 물줄기로 바꿔 산미와 다채로운 향을 균형 있게 추출합니다.',
    image: '/api/placeholder/300/200',
    youtubeUrl: 'https://youtu.be/bFbMHE59T2I?si=8-3BkuNWoDZ9WmjB',
    steps: [
      {
        time: 40,
        title: '뜸들이기',
        description: '40초 동안 충분히 뜸을 들입니다.',
        water: '45ml',
        totalWater: 45,
      },
      {
        time: 70,
        title: '1차 추출',
        description: '굵고 빠른 물줄기로 중앙부터 원을 그리며 붓습니다.',
        water: '70ml',
        totalWater: 115,
      },
      {
        time: 105,
        title: '2차 추출',
        description: '굵고 빠른 물줄기로 동일하게 붓습니다.',
        water: '75ml',
        totalWater: 190,
      },
      {
        time: 140,
        title: '3차 추출',
        description: '가늘고 느린 물줄기로 중앙 위주로 부어 농도를 조절합니다.',
        water: '50ml',
        totalWater: 240,
      },
    ],
  },
  {
    id: 7,
    name: '블랙로드 솔로 드리퍼 레시피',
    totalTime: 150,
    coffee: '12g',
    water: '190ml',
    ratio: '1:16',
    waterTemperature: '95°C',
    dripper: '솔로 드리퍼',
    filter: '칼리타 웨이브 155',
    description: `체코 브루어스컵 챔피언 "재키"의 솔로드리퍼 레시피
        2025 월드 브루어스 챔피언 George Jinyang Peng도 솔로드리퍼로 우승했습니다.`,
    image: '/api/placeholder/300/200',
    steps: [
      {
        time: 30,
        title: '뜸들이기',
        description: '30초 동안 충분히 뜸을 들입니다.',
        water: '40ml',
        totalWater: 40,
      },
      {
        time: 50,
        title: '1차 추출',
        description: '굵은 물줄기로 부어주세요.',
        water: '50ml',
        totalWater: 90,
      },
      {
        time: 80,
        title: '2차 추출',
        description: '얇은 물줄기로 부어주세요.',
        water: '50ml',
        totalWater: 140,
      },
      {
        time: 140,
        title: '3차 추출',
        description: '물이 다 빠질 때까지 기다리세요.',
        water: '50ml',
        totalWater: 190,
      },
    ],
  },

  {
    id: 8,
    name: '오리가미 핫 레시피 ver 1.0',
    totalTime: 140,
    coffee: '18g',
    water: '270ml',
    ratio: '1:15',
    waterTemperature: '93-94°C',
    dripper: '오리가미 에어 S',
    filter: '칼리타 웨이브 185 필터',
    youtubeUrl: 'https://www.youtube.com/watch?v=Ud0JGr_kMYE&t',
    description:
      '아이덴티티 커피랩 윤원균 대표의 오리가미 에어 핫 레시피입니다. 깔끔하면서도 단맛과 풍부한 향미를 표현하는 데 중점을 둡니다.',
    image: '/api/placeholder/300/200',
    steps: [
      {
        time: 35,
        title: '뜸들이기',
        description: '40g의 물을 붓고 35초간 기다립니다.',
        water: '40ml',
        totalWater: 40,
      },
      {
        time: 65,
        title: '1차 추출',
        description: '35초부터 150g이 될 때까지 물을 붓습니다.',
        water: '110ml',
        totalWater: 150,
      },
      {
        time: 140,
        title: '2차 추출 및 완료',
        description:
          '물이 절반 정도 빠지면, 270g이 될 때까지 강한 물줄기로 붓고 추출을 완료합니다.',
        water: '120ml',
        totalWater: 270,
      },
    ],
  },
  {
    id: 9,
    name: '오리가미 아이스 브루잉 레시피',
    totalTime: 125,
    coffee: '20g',
    water: '200ml',
    ratio: '1:10',
    waterTemperature: '92-95°C',
    dripper: '오리가미 에어 S',
    filter: '칼리타 웨이브 185 필터',
    youtubeUrl: 'https://www.youtube.com/watch?v=Ud0JGr_kMYE&t',
    description:
      '아이덴티티 커피랩 윤원균 대표의 오리가미 에어 아이스 레시피입니다. 농축된 커피를 추출하여 얼음으로 희석해 청량하고 달콤한 맛을 냅니다. 서버에 얼음 약 95g을 미리 준비해주세요.',
    image: '/api/placeholder/300/200',
    steps: [
      {
        time: 35,
        title: '뜸들이기',
        description: '40g의 물을 붓고 35초간 기다립니다.',
        water: '40ml',
        totalWater: 40,
      },
      {
        time: 70,
        title: '1차 추출',
        description: '35초부터 110g이 될 때까지 물을 붓습니다.',
        water: '70ml',
        totalWater: 110,
      },
      {
        time: 125,
        title: '2차 추출 및 완료',
        description:
          '물이 충분히 빠질 때까지 기다린 후, 200g이 될 때까지 붓고 추출을 완료합니다.',
        water: '90ml',
        totalWater: 200,
      },
    ],
  },
  {
    id: 10,
    name: '오리가미 콘 필터 핫 브루잉 레시피 (ver. 2)',
    totalTime: 140,
    coffee: '16g',
    water: '260ml',
    ratio: '1:16.25',
    waterTemperature: '92°C',
    dripper: '오리가미 에어 S',
    filter: '오리가미 콘 필터',
    youtubeUrl: 'https://www.youtube.com/watch?v=k0YQ8vKRD4s',
    description:
      '아이덴티티 커피랩의 오리가미 콘 필터 레시피입니다. 빠른 추출 속도를 활용해 미분을 컨트롤하고, 수위 조절을 통해 깔끔하고 쫀득한 질감과 복합적인 맛을 이끌어냅니다.',
    image: '/api/placeholder/300/200',
    steps: [
      {
        time: 35,
        title: '뜸들이기',
        description: '40g의 물을 붓고 35초간 기다립니다.',
        water: '40ml',
        totalWater: 40,
      },
      {
        time: 75,
        title: '1차 추출',
        description:
          '35초부터 140g이 될 때까지 안쪽에서 바깥쪽으로 원을 그리며 붓습니다.',
        water: '100ml',
        totalWater: 140,
      },
      {
        time: 85,
        title: '2차 추출',
        description: '1분 15초에 바깥쪽에서 안쪽으로 200g까지 붓습니다.',
        water: '60ml',
        totalWater: 200,
      },
      {
        time: 140,
        title: '3차 추출 및 완료',
        description:
          '1분 25초에 중앙에만 260g까지 부어주고, 총 추출 시간 2분 10초 ~ 2분 20초 사이에 완료합니다.',
        water: '60ml',
        totalWater: 260,
      },
    ],
  },
  {
    id: 11,
    name: '오리가미 콘 필터 아이스 브루잉 레시피 (ver. 2)',
    totalTime: 130,
    coffee: '19g',
    water: '200ml',
    ratio: '1:10.5',
    waterTemperature: '92°C',
    dripper: '오리가미 에어 S',
    filter: '오리가미 콘 필터',
    youtubeUrl: 'https://www.youtube.com/watch?v=k0YQ8vKRD4s&t=774s',
    description:
      '아이덴티티 커피랩의 오리가미 콘 필터 아이스 레시피입니다. 핫 레시피보다 원두 양을 늘리고 분쇄도를 가늘게 하여 농축된 추출을 목표로 합니다. 서버에 얼음 8~10알을 미리 준비해주세요.',
    image: '/api/placeholder/300/200',
    steps: [
      {
        time: 35,
        title: '뜸들이기',
        description: '40g의 물을 붓고 35초간 기다립니다.',
        water: '40ml',
        totalWater: 40,
      },
      {
        time: 70,
        title: '1차 추출',
        description: '35초부터 가는 물줄기로 100g까지 붓습니다.',
        water: '60ml',
        totalWater: 100,
      },
      {
        time: 100,
        title: '2차 추출',
        description: '1분 10초에 중간 물줄기로 150g까지 붓습니다.',
        water: '50ml',
        totalWater: 150,
      },
      {
        time: 130,
        title: '3차 추출 및 완료',
        description:
          '물이 어느 정도 빠지면 중간 물줄기로 200g까지 붓고, 총 추출 시간 2분 10초 내외로 완료합니다.',
        water: '50ml',
        totalWater: 200,
      },
    ],
  },
  {
    id: 12,
    name: '히데 이자키 핫 V60 레시피',
    totalTime: 210,
    coffee: '21g',
    water: '300ml',
    ratio: '1:14.3',
    waterTemperature: '94°C',
    dripper: '하리오 V60 (플라스틱 추천)',
    filter: '카펙 아바카 필터',
    youtubeUrl: 'https://www.youtube.com/watch?v=Ly7hQEzH8lw',
    description:
      '2014 월드 바리스타 챔피언 히데 이자키의 핫 커피 레시피입니다. 집에서도 쉽게 따라할 수 있도록 고안된 이 레시피는 21g의 원두를 사용하여 총 300ml를 3번에 나누어 추출합니다(60g-60g-180g). 특히 분쇄 전 원두에 물 한 방울을 섞어 정전기를 방지(RDT)하고, 로스팅 정도에 따라 분쇄도를 조절하는 것이 특징입니다.',
    image: '/api/placeholder/300/200',
    steps: [
      {
        time: 60,
        title: '뜸들이기',
        description:
          '가운데를 오목하게 만들고 60g의 물을 천천히 붓고 스월링한 후 1분간 기다립니다.',
        water: '60ml',
        totalWater: 60,
      },
      {
        time: 120,
        title: '1차 추출',
        description:
          '1분이 되면 다시 60g의 물을 낙차가 크지 않게 부어 총 120g을 맞추고 1분간 더 기다립니다.',
        water: '60ml',
        totalWater: 120,
      },
      {
        time: 210,
        title: '2차 추출 및 완료',
        description:
          '2분이 되면 나머지 180g의 물을 조금 더 높은 위치에서 부어줍니다. 총 추출 시간 3분~3분 30초 내외로 완료합니다.',
        water: '180ml',
        totalWater: 300,
      },
    ],
  },
  {
    id: 13,
    name: '히데 이자키 아이스 V60 레시피',
    totalTime: 185,
    coffee: '30g',
    water: '180ml (+ 얼음 120g)',
    ratio: '1:10',
    waterTemperature: '94°C',
    dripper: '하리오 V60 (플라스틱 추천)',
    filter: '카펙 아바카 필터',
    youtubeUrl: 'https://www.youtube.com/watch?v=Ly7hQEzH8lw',
    description:
      '2014 월드 바리스타 챔피언 히데 이자키의 아이스 커피 레시피입니다. 1:10의 비율로 진하게 추출하여 얼음으로 희석하는 방식을 사용합니다. 핫 레시피보다 분쇄도를 굵게 조절하는 것이 특징입니다. 서버에 얼음 120g을 미리 준비해주세요.',
    image: '/api/placeholder/300/200',
    steps: [
      {
        time: 60,
        title: '뜸들이기',
        description: '60g의 물을 천천히 붓고 스월링한 후 1분간 기다립니다.',
        water: '60ml',
        totalWater: 60,
      },
      {
        time: 120,
        title: '1차 추출',
        description: '1분이 되면 다시 60g의 물을 부어 총 120g을 맞춥니다.',
        water: '60ml',
        totalWater: 120,
      },
      {
        time: 185,
        title: '2차 추출 및 완료',
        description:
          '2분이 되면 나머지 60g의 물을 조금 더 빠르게 부어줍니다. 총 추출 시간 3분 5초 내외로 완료하고 서버를 잘 흔들어줍니다.',
        water: '60ml',
        totalWater: 180,
      },
    ],
  },
  {
    id: 14,
    name: '헤베커피 2인분 브루잉 레시피',
    totalTime: 175,
    coffee: '30g',
    water: '360ml (추출 후 희석)',
    ratio: '1:12',
    waterTemperature: '91°C',
    dripper: '하리오 V60 (글라스)',
    filter: 'V60 종이 필터',
    youtubeUrl: 'https://www.youtube.com/watch?v=9iul1LUdx6k&t=919s',
    description:
      '헤베커피의 2인분 브루잉 레시피입니다. 1인분 레시피의 2배가 아닌 1.5배의 원두(30g)를 사용하여 농축액을 추출한 뒤, 취향에 맞게 물이나 얼음으로 희석하여 두 잔을 만드는 방식입니다. 많은 양의 원두를 사용하기 때문에 91°C의 낮은 온도로 불필요한 성분 추출을 억제합니다. 따뜻하게 마실 경우, 추출된 커피에 50~70g의 물을 추가하고, 아이스로 마실 경우 얼음 잔에 바로 부어 즐길 수 있습니다.',
    image: '/api/placeholder/300/200',
    steps: [
      {
        time: 50,
        title: '뜸들이기',
        description: '60g의 물을 붓고 50초간 기다립니다.',
        water: '60ml',
        totalWater: 60,
      },
      {
        time: 80,
        title: '1차 추출',
        description:
          '50초부터 100g의 물을 부어 총 160g을 맞추고, 1분 20초까지 기다립니다.',
        water: '100ml',
        totalWater: 160,
      },
      {
        time: 110,
        title: '2차 추출',
        description:
          '1분 20초부터 다시 100g의 물을 부어 총 260g을 맞추고, 1분 50초까지 기다립니다.',
        water: '100ml',
        totalWater: 260,
      },
      {
        time: 175,
        title: '3차 추출 및 완료',
        description:
          '1분 50초부터 나머지 100g의 물을 부어 총 360g을 맞춥니다. 2분 50초에서 3분 사이에 추출을 완료합니다.',
        water: '100ml',
        totalWater: 360,
      },
    ],
  },
];

export const getRecipeById = (id: number): Recipe | undefined => {
  return recipes.find((recipe) => recipe.id === id);
};

export const getAllRecipes = (): Recipe[] => {
  return recipes;
};
