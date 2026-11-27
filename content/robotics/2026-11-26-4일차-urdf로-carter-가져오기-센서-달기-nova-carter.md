---
title: "4일차 · URDF로 Carter 가져오기·센서 달기·Nova Carter"
date: 2026-11-26
description: "carter.urdf를 읽고 URDF Importer로 가져와 차동 제어기·속도 제한으로 조종하고, chassis_link에 카메라·2D 라이다를 단 뒤 센서가 이미 달린 Nova Carter와 비교했다."
tags:
  - "OmniGraph"
  - "센서"
  - "OpenUSD"
  - "Isaac-Sim"
aliases:
  - "notes/2026-11-26-4일차-urdf로-carter-가져오기-센서-달기-nova-carter"
notion_id: 42447b7c-c0d4-81a5-9ae4-d03e217a3686
---

> 4일차 · Ingesting Robot Assets and Simulating Your Robot in Isaac Sim (S-OV-29)

지금까지 손으로 하던 로봇 만들기를 URDF로 대신했다. carter.urdf의 링크·관절 구조를 읽고 URDF Importer로 가져오자, 2·3일차에 손으로 한 강체·충돌체·관절·드라이브·Articulation Root가 자동으로 들어갔다. 바닥에 내려놓고 관절을 확인한 뒤 차동 제어기를 달고, 너무 빠른 속도를 0.5로 제한했다. URDF에는 없는 카메라·2D 라이다를 chassis_link에 직접 달고, 마지막으로 모든 게 이미 들어 있는 Nova Carter 에셋과 비교했다.

### 학습 목표

공식 과정 S-OV-29 (1H, 공개 본문: [docs.nvidia.com/learning/physical-ai](http://docs.nvidia.com/learning/physical-ai) → Getting Started With Isaac Sim → Ingesting Robot Assets)

- URDF 구조(링크·관절)를 읽는다
- URDF Importer로 로봇을 가져와 시뮬레이션한다
- 차동 제어기와 키보드로 조종한다
- 과속 같은 물리 문제를 찾아 고친다
- 센서와 장애물이 있는 환경을 만든다

이어지는 내용: [3일차 · 로봇 조종·센서 달기·ROS 2로 데이터 보내기](https://app.notion.com/p/42447b7cc0d4813c8756c5accdd8493d)

### 핵심 개념

#### URDF (Unified Robot Description Format)

- 로봇의 몸 구조를 적은 XML 파일. ROS에서 표준으로 쓰는 로봇 설계도.
- 들어 있는 것: 링크(단단한 부품), 관절(링크를 잇는 방식), 모양(visual·collision), 질량·관성.
- 보통 없는 것: 센서, 재질의 물리 성질, 제어기 → Isaac Sim에서 더한다.
- `<link>` 안: `<visual>` = 보이는 모양(메시, 자세히), `<collision>` = 부딪히는 모양(단순히, 예: 반지름 0.24 m 원기둥), `<inertial>` = 질량·관성. 부딪히는 모양을 단순하게 해야 시뮬레이션이 빨라진다.
- `<joint>`는 링크 안이 아니라 `<robot>` 바로 아래에 나란히 있고, 부모·자식은 `<parent>`·`<child>`로 정한다.

```xml
<joint name="left_wheel" type="continuous">   <!-- 끝없이 도는 회전 관절 -->
  <parent link="chassis_link"/>
  <child link="left_wheel_link"/>
  <origin xyz="0 0.31420517 0"/>               <!-- 몸체 중심에서 왼쪽 0.314 m -->
  <axis xyz="0 1 0"/>                           <!-- Y축 회전 -->
</joint>
```

#### carter.urdf의 링크·관절 나무

| 관절 | 종류 | 축 | 부모 → 자식 | 역할 | Importer Target |
| --- | --- | --- | --- | --- | --- |
| left_wheel · right_wheel | 회전(continuous) | Y | chassis_link → 바퀴 링크 | 구동 바퀴 | Velocity (Damping 약 308) |
| rear_pivot | 회전 | Z | chassis_link → rear_pivot_link | 캐스터 방향 바꾸기 | None (Damping 0) |
| rear_axle | 회전 | Y | rear_pivot_link → rear_wheel_link | 캐스터 구르기 | None (Damping 0) |
| com_joint · imu_joint | 고정 | — | chassis_link → com_offset · imu | 고정 링크 | — |

- 루트 링크는 chassis_link. 캐스터 = 쇼핑 카트 바퀴처럼 모터 없이 로봇이 움직이는 방향으로 저절로 도는 수동 관절.
- 차동 제어기 값: 바퀴 반지름 0.24 m(`<cylinder radius="0.240">`, Play 후 몸체 높이 z = 0.24와도 같음), 바퀴 간격 0.314 × 2 = 0.628 m(공식 과정 값 0.62 사용).

#### URDF Importer 옵션

| 옵션 | 이동로봇 (오늘) | 로봇팔 (다음) |
| --- | --- | --- |
| Links | Moveable Base (바닥에 고정 안 함) | Static Base |
| 구동 관절 Target | Velocity | Position |
| 수동 관절 Target | None | — |
| Joint Configuration | Natural Frequency (기본값) |   |

- Import하면 URDF 옆에 `carter/carter.usd`와 `configuration/` 폴더가 생기고, 장면의 `/World/carter`가 그 파일을 참조한다.
- Stage에는 링크마다 Xform(chassis_link, left_wheel_link …)과 joints 폴더(관절 6개)가 생긴다. Articulation Root는 chassis_link에 붙는다.

#### 과속 문제와 속도 제한

- 키보드 W 하나 = 선속도 5 m/s → 바퀴 5 ÷ 0.24 = 20.8 rad/s. 이 로봇에게 너무 빨라 3초에 3.3 m를 휘청이며 가다 방향이 157°·176° 틀어졌다.
- DifferentialController 노드의 maxLinearSpeed = 0.5, maxAngularSpeed = 0.5로 제한하자 3초에 1.43 m(약 0.48 m/s) 똑바로 갔다.
- 공식 확인 방법: 주행 중 chassis_link의 Rigid Body 속도가 0.5 m/s를 넘지 않는지 본다.

#### 센서는 링크 아래에

- URDF에는 센서가 없으므로 Isaac Sim에서 붙인다. 3일차처럼 Xform + Fixed Joint를 따로 만들지 않고 **몸체 링크 chassis_link의 자식으로 바로** 넣어야 함께 움직인다.
- 카메라 = 무엇이 있는지, 라이다 = 얼마나 먼지.
- PhysX 라이다: 회색 선 = 아무것도 안 맞음, 빨간 선 = 물체에 맞음. 충돌체가 없는 장애물은 통과한다.

#### Nova Carter (준비된 로봇)

- 센서·재질·물리 값이 이미 들어 있는 에셋. 실제 로봇 플랫폼(Jetson AGX Orin 기반 자율이동로봇)을 옮긴 참조 로봇이고, Isaac ROS·Nav2 예제가 이 로봇을 쓴다.
- 라이다는 PhysX가 아닌 **RTX 라이다(OmniLidar)**: 빛을 렌더링해서 재므로 물리 충돌체가 없는 물체도 본다.

| 위치 (chassis_link/sensors/) | 종류 | 개수 |
| --- | --- | --- |
| front_hawk · left_hawk · right_hawk · back_hawk | 스테레오 카메라(좌·우) + IMU | 4쌍 |
| front_owl · left_owl · right_owl · back_owl | 어안 카메라 | 4 |
| front_RPLidar · rear_RPLidar | 2D 라이다 (RTX) | 2 |
| XT_32 | 3D 라이다 (RTX) | 1 |
| chassis_imu | IMU | 1 |

### 실습 / 코드

#### 1. URDF Importer로 가져오기

```bash
source /opt/ros/jazzy/setup.bash
~/nvidia_dli/isaacsim/isaac-sim.sh
```

1. File > New (Don't Save) → File > Import → 경로 칸에 `~/nvidia_dli/carter/urdf/` → carter.urdf 클릭.
1. Links: Moveable Base, Joint Configuration: Natural Frequency, 관절 Target: left_wheel·right_wheel = Velocity, rear_axle·rear_pivot = None.
1. Import → 저장 위치 확인 창 Yes.

#### 2. 바닥·관절·주행 시험

1. Create > Environments > Flat Grid (바닥 + 조명), Stage의 Environment 눈 아이콘 끄기.
1. carter Translate Z = 0.3 → Play 2초: 몸체 높이 z = 0.24 m로 바닥에 섬.
1. joints에서 left_wheel·rear_pivot 등을 클릭해 Axis·Damping·Body 0/1 확인.
1. left_wheel + Ctrl + right_wheel 선택 → Drive > Angular의 Target Velocity = 20 → Play 4초.
1. Play 중 left_wheel만 Target Velocity = 0 → 왼쪽으로 돌고 캐스터가 저절로 방향을 바꿈. 끝나면 두 값 0으로.

#### 3. 차동 제어기와 속도 제한

Tools > Robotics > OmniGraph Controllers > Differential Controller:

| 칸 | 값 |
| --- | --- |
| Robot Prim | /World/carter |
| wheel radius | 0.24 |
| distance between wheels | 0.62 |
| Right Joint Name | **left_wheel** (5.1: 서로 바꿔 넣음) |
| Left Joint Name | **right_wheel** |
| Use Keyboard Control (WASD) | 체크 |

그다음 Stage의 Graphs > differential_controller > DifferentialController를 골라 maxLinearSpeed = 0.5, maxAngularSpeed = 0.5 → Ctrl+S.

#### 4. 카메라·라이다·장애물

1. chassis_link 우클릭 > Create > Camera → 이름 RGB_Sensor, Translate (0.1, 0, 0.33), Orient (90, −90, 0)(2·3일차와 같은 값, 앞 +X를 봄).
1. Stage 빈 곳 클릭 후 장애물: Cube (2, 0.6, 0.5), Cylinder (2.5, −1, 0.5), Cone (−1.5, 1.5, 0.5), Cube (0.5, −2.2, 0.5).
1. Perspective > Cameras > RGB_Sensor / Window > Viewports > Viewport 2로 두 화면.
1. chassis_link 선택 → Create > Sensors > PhysX Lidar > Rotating → Translate (−0.05, 0, 0.42)(위 원기둥 자리) → Raw USD Properties에서 drawLines 체크.
1. 장애물 4개에 Rigid Body with Colliders Preset → Play, WASD로 몰며 Viewport 2와 라이다 선 확인 → Ctrl+S.

#### 5. Nova Carter

File > New → Flat Grid → Environment 눈 끄기 → Create > Robots > Nova Carter with Sensors (처음엔 에셋 다운로드로 몇 분).

#### 측정 결과 (강사 PC)

| 실험 | 결과 | 계산 / 해석 |
| --- | --- | --- |
| 양쪽 바퀴 20 °/s, 4초 | 0.36 m 전진 | 0.349 rad/s × 0.24 m × 4 s = 0.335 m (캡처 중에도 시뮬이 돌아 조금 더 재짐) |
| 왼쪽 바퀴만 0, 4초 | 왼쪽 26.7° | 캐스터가 저절로 방향을 바꿈 |
| ω = +0.5 rad/s, 3초 | 칸 이름대로 −89.2° / 바꿔 넣음 +88.3° | 5.1 관절 칸 문제 (3일차와 같음) |
| W 3초, 제한 없음 | 3.3 m, 방향 157°·176° 틀어짐 | 5 m/s는 과속 |
| W 3초, maxLinearSpeed 0.5 | 1.43 m 직진 (약 0.48 m/s) | 제한 후 안정 |

### 환경 메모

| 단계 | 공식 본문 | 5.1 |
| --- | --- | --- |
| 차동 제어기 관절 칸 | Right = right_wheel, Left = left_wheel | 서로 바꿔 넣기 |
| 속도 제한 | 0.5 (4.2) · 0.2 (4.5)로 엇갈림 | 0.5로 통일 |
| Articulation Root | 4.2: carter Xform으로 옮기기 | chassis_link에 그대로 두어도 동작 (제어기가 Robot Prim 아래에서 찾음) |

### 문제 해결

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| A를 누르면 오른쪽으로 돎 | 5.1 차동 제어기 창의 관절 순서 문제 | Right 칸에 left_wheel, Left 칸에 right_wheel |
| 휘청이며 방향이 크게 틀어짐 | 키 하나 = 5 m/s 과속 | maxLinearSpeed·maxAngularSpeed = 0.5 |
| 로봇이 공중에 떠 있음 | 바닥이 없음 | Flat Grid 추가, Translate Z = 0.3 |
| 라이다 선이 장애물 통과 | 장애물에 충돌체 없음 (PhysX) | Rigid Body with Colliders Preset |
| 장애물이 로봇 안에 생김 | 로봇을 선택한 채 Create | Stage 빈 곳 클릭 후 생성 |
| 마우스로 끌 때 딱딱 끊김 | Snap 켜짐 | 왼쪽 도구 막대의 자석 아이콘 끄기 |
| 카메라 시점에서 마우스를 움직였더니 센서가 움직임 | 카메라 시점에선 마우스가 카메라를 옮김 | 끝나면 반드시 Perspective로 돌아옴 |

### 내 메모 (RemNote)

[RemNote 11월 26일 데일리 문서](https://www.remnote.com/w/6ad729eabbafaa9b9157b9c2/November-26th-2026-Qu2Rn92uZrX2j2gmG)에 적어 둔 메모를 옮기고, 틀린 부분은 고쳤다(아래 '고친 내용' 참고).

- A* 알고리즘 : Dijkstra에 "목표까지 남은 거리 추정(휴리스틱)"을 더해 목표 쪽부터 탐색하는 최단 경로 알고리즘 (1일차 실습 ③: 같은 경로를 Dijkstra의 약 1/3 칸만 보고 찾음)

**Isaac Sim 팁**

- 어안 카메라 : 시야각이 더 넓다 (대신 가장자리가 휘어 보이는 왜곡이 큼. Nova Carter의 owl 카메라)
- snap(S) : 마우스로 옮길 때 translate 값이 정해진 간격(격자 단위)으로 끊어서 움직임. 미세 조정할 때는 왼쪽 도구 막대의 자석 아이콘으로 끔

**고친 내용**

| 원래 메모 | 고친 것 | 이유 |
| --- | --- | --- |
| a* 알고리즘 : bfs 개선된 알고리즘 사용 | Dijkstra + 휴리스틱 | A*는 가중치가 있는 최단 경로를 찾는 Dijkstra에 목표 방향 추정을 더한 것. BFS는 가중치를 모두 같게 보는 단순 너비 우선 탐색 |
| snap : 정수로 떨어지는 translate 값 | 정해진 간격(격자 단위) | 스냅 간격은 설정에 따라 달라서 꼭 정수는 아님 |
| 어안 카메라 | 왜곡 추가 | 틀린 건 아니지만 장단점을 함께 |

### 복습 질문

> [!question]- Q1. URDF에 보통 들어 있지 않아서 Isaac Sim에서 더해야 하는 것은?
> 센서, 재질의 물리 성질, 제어기. URDF는 링크·관절·모양·질량·관성만 적는다.

> [!question]- Q2. `<visual>`과 `<collision>`을 따로 두고 collision을 단순하게 하는 이유는?
> 보이는 모양은 자세해야 하지만 충돌 계산은 단순한 모양이어야 시뮬레이션이 빨라진다(Carter 바퀴 충돌 = 반지름 0.24 m 원기둥).

> [!question]- Q3. 이동로봇과 로봇팔을 URDF Importer로 가져올 때 옵션은 각각 어떻게 다른가?
> 이동로봇은 Moveable Base + 구동 관절 Velocity(수동 관절 None), 로봇팔은 Static Base + Position.

> [!question]- Q4. Carter의 rear_pivot과 rear_axle은 무엇이고, Target을 None으로 두는 이유는?
> 뒷쪽 캐스터의 방향 바꾸기(Z축)와 구르기(Y축) 관절이다. 모터 없이 로봇이 움직이는 대로 따라 도는 수동 관절이라 구동(Damping)이 없어야 한다.

> [!question]- Q5. W를 누르면 Carter가 휘청이며 방향이 틀어진 원인과 해결책은?
> 키보드 키 하나가 5 m/s(바퀴 20.8 rad/s)를 줘서 과속이다. DifferentialController의 maxLinearSpeed·maxAngularSpeed를 0.5로 제한한다.

> [!question]- Q6. 가져온 로봇에 센서를 달 때 3일차와 다른 점은?
> 별도의 Xform + Fixed Joint를 만들지 않고 몸체 링크(chassis_link)의 자식으로 바로 넣는다. 링크 아래에 있어야 함께 움직인다.

> [!question]- Q7. PhysX 라이다와 Nova Carter의 RTX 라이다는 무엇이 다른가?
> PhysX 라이다는 물리 충돌 모양만 보지만, RTX 라이다(OmniLidar)는 빛을 렌더링해서 재므로 충돌체가 없는 물체도 본다.

### 다음에 할 것

- [ ] 해 볼 것: 2일차 SimpleRobot을 URDF로 적는다면 링크·관절은 몇 개이고 각각의 type은?
- [ ] 해 볼 것: carter.urdf의 com_joint는 무엇을 위한 링크일까? (이름·origin을 보고 추측)
- [ ] 미션 A: S자 길(폭 1.2 m 정도) + 목표 상자. RGB_Sensor 시점과 라이다 선만 보고 키보드로 통과, 걸린 시간·부딪힌 횟수 기록. maxLinearSpeed 0.3·0.8로도 해 보기
- [ ] 미션 B: SimpleRobot·Carter·Nova Carter의 Stage 계층을 표로 비교 (링크 수·구동 관절·수동 관절·센서·Articulation Root 위치)
- [ ] 구글 클래스룸 퀴즈
- [ ] 다음 예습: DLI 1 통합 실습 — UR10e 로봇팔을 ROS 2 로봇 설명에서 가져오고(Static Base, Position), 그리퍼를 붙여 Variant로 만들고, 창고 장면에서 IK로 움직이기
