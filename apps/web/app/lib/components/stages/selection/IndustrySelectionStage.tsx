"use client";

import { useRef, useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  localizeRecommendationItem,
  localizeStarterIndustryCategory,
  starterIndustryCategories,
  starterIndustryOptions,
} from "@build-up/shared";

export function IndustrySelectionStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    selectedIndustryCategoryId, setSelectedIndustryCategoryId,
    selectedIndustryId, setSelectedIndustryId,
    canCompleteIndustryStep, handleIndustryContinue,
    prevTraversedStage, setViewingStageId,
    resetDemo,
  } = d;
  const optionGridRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);

  return (
    <>
      <div style={styles.helper}>
        {copy.home.chooseIndustryHelp}
      </div>
      <div style={styles.categoryTabBar}>
        {starterIndustryCategories.map((rawCategory) => {
          const category = localizeStarterIndustryCategory(rawCategory, language);
          return (
            <button
              key={rawCategory.id}
              type="button"
              style={{
                ...styles.categoryTab,
                ...(selectedIndustryCategoryId === rawCategory.id ? styles.categoryTabSelected : {})
              }}
              onClick={() => {
                setSelectedIndustryCategoryId(rawCategory.id);
                setSelectedIndustryId(undefined);
              }}
            >
              {category.title}
            </button>
          );
        })}
      </div>
      <div ref={optionGridRef} style={{ ...styles.optionGrid, ...(shakeWarning ? { outline: "2px solid #dc2626", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
        {(() => {
          // 업종별 아이콘 (SF Symbol 스타일 SVG)
          const industryIcons: Record<string, string> = {
            // food — Material Design Icons (viewBox: 0 -960 960 960)
            "korean-casual": "MAT:M280-80v-366q-51-14-85.5-56T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 56-34.5 98T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z",  // restaurant (한식 — 뚝배기/수저)
            "delivery-meals": "MAT:M195-235q-35-35-35-85H80v-120q0-66 47-113t113-47h160v200h140l140-174v-106H560v-80h120q33 0 56.5 23.5T760-680v134L580-320H400q0 50-35 85t-85 35q-50 0-85-35Zm125-165Zm-11.5 108.5Q320-303 320-320h-80q0 17 11.5 28.5T280-280q17 0 28.5-11.5ZM200-640v-80h200v80H200Zm475 405q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35Zm113.5-56.5Q800-303 800-320t-11.5-28.5Q777-360 760-360t-28.5 11.5Q720-337 720-320t11.5 28.5Q743-280 760-280t28.5-11.5ZM160-400h160v-120h-80q-33 0-56.5 23.5T160-440v40Z",  // delivery_dining (배달)
            "salad-healthy": "MAT:M216-176q-45-45-70.5-104T120-402q0-63 24-124.5T222-642q35-35 86.5-60t122-39.5Q501-756 591.5-759t202.5 7q8 106 5 195t-16.5 160.5q-13.5 71.5-38 125T684-182q-53 53-112.5 77.5T450-80q-65 0-127-25.5T216-176Zm112-16q29 17 59.5 24.5T450-160q46 0 91-18.5t86-59.5q18-18 36.5-50.5t32-85Q709-426 716-500.5t2-177.5q-49-2-110.5-1.5T485-670q-61 9-116 29t-90 55q-45 45-62 89t-17 85q0 59 22.5 103.5T262-246q42-80 111-153.5T534-520q-72 63-125.5 142.5T328-192Z",  // eco (샐러드/건강식)
            "ramen-noodle": "MAT:M400-160h160v-44l50-20q65-26 110.5-72.5T786-400H174q20 57 65 103.5T350-224l50 20v44Zm-80 80v-70q-107-42-173.5-130T80-480h80v-320l720-80v60l-460 52v68h460v60H420v160h460q0 112-66.5 200T640-150v70H320Zm0-620h40v-62l-40 5v57Zm-100 0h40v-50l-40 4v46Zm100 220h40v-160h-40v160Zm-100 0h40v-160h-40v160Zm260 80Z",  // ramen_dining (면/국밥)
            "chicken-burger": "MAT:M160-120q-33 0-56.5-23.5T80-200v-120h800v120q0 33-23.5 56.5T800-120H160Zm0-120v40h640v-40H160Zm263-160q-21 20-77 20t-76-20q-20-20-56-20t-57 20q-21 20-77 20v-80q36 0 57-20t77-20q56 0 76 20t56 20q36 0 57-20t77-20q56 0 77 20t57 20q36 0 56-20t76-20q56 0 79 20t55 20v80q-56 0-75-20t-55-20q-36 0-58 20t-78 20q-56 0-77-20t-57-20q-36 0-57 20ZM80-560v-40q0-115 108.5-177.5T480-840q183 0 291.5 62.5T880-600v40H80Zm400-200q-124 0-207.5 31T166-640h628q-23-58-106.5-89T480-760Z",  // lunch_dining (치킨/버거)
            "western-pasta-brunch": "MAT:m160-120-80-80h800l-80 80H160Zm-40-120q6-18 16-34t24-30v-296h-40v-60h40v-30h-40v-60h40v-30h-40v-60h280q33 0 56.5 23.5T480-760v10h360v60H480v10q0 33-23.5 56.5T400-600h-80v244q14 2 28 6t26 12q26-65 83-103.5T583-480q90 0 153.5 61.5T800-268v28H120Zm334-80h252q-17-36-50-58t-73-22q-42 0-77 21t-52 59ZM320-750h80v-30h-80v30Zm0 90h80v-30h-80v30Zm-100-90h40v-30h-40v30Zm0 90h40v-30h-40v30Zm0 314q10-5 19.5-7.5T260-358v-242h-40v254Zm360 26Z",  // dinner_dining (양식/스테이크)
            // cafe — 컵, 원두, 디저트
            "takeout-coffee": "MAT:M160-120v-80h640v80H160Zm160-160q-66 0-113-47t-47-113v-400h640q33 0 56.5 23.5T880-760v120q0 33-23.5 56.5T800-560h-80v120q0 66-47 113t-113 47H320Zm0-80h240q33 0 56.5-23.5T640-440v-320H240v320q0 33 23.5 56.5T320-360Zm400-280h80v-120h-80v120Z",  // local_cafe
            "specialty-coffee": "MAT:M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h560v80h-80v80q0 17-11.5 28.5T680-680H360q-17 0-28.5-11.5T320-720v-80h-80v640h162q-38-27-60-68.5T320-320v-200h400v200q0 50-22 91.5T638-160h162v80H240Zm280-120q50 0 85-35t35-85v-120H400v120q0 50 35 85t85 35Z",  // coffee_maker
            "dessert-cafe": "MAT:M160-80q-17 0-28.5-11.5T120-120v-200q0-33 23.5-56.5T200-400v-160q0-33 23.5-56.5T280-640h160v-58q-18-12-29-29t-11-41q0-15 6-29.5t18-26.5l56-56 56 56q12 12 18 26.5t6 29.5q0 24-11 41t-29 29v58h160q33 0 56.5 23.5T760-560v160q33 0 56.5 23.5T840-320v200q0 17-11.5 28.5T800-80H160Z",  // cake
            "bakery-studio": "MAT:M804-282q17 9 30-4t4-30l-58-108-42 108 66 34Zm-200-38h48l96-238q3-8-1.5-13.5T736-580l-80-32q-9-3-17.5 2T628-596l-24 276Zm-296 0h48l-24-276q-2-11-10.5-15t-17.5-1l-80 32q-8 3-11.5 8.5T212-558l96 238Zm-152 38 66-34-42-108-58 108q-9 17 4 30t30 4Zm280-38h88l30-338q2-9-4.5-15.5T534-680H426q-8 0-14.5 6.5T406-658l30 338Z",  // bakery_dining
            "icecream-bingsu": "MAT:M482-40 294-400q-71 3-122.5-41T120-560q0-51 29.5-92t74.5-58q18-91 89.5-150.5T480-920q95 0 166.5 59.5T736-710q45 17 74.5 58t29.5 92q0 75-53 119t-119 41L482-40Z",  // icecream
            "self-serve-cafe": "MAT:M280-640q-33 0-56.5-23.5T200-720v-80q0-33 23.5-56.5T280-880h400q33 0 56.5 23.5T760-800v80q0 33-23.5 56.5T680-640H280Zm0-80h400v-80H280v80ZM160-80q-33 0-56.5-23.5T80-160v-40h800v40q0 33-23.5 56.5T800-80H160ZM80-240l139-313q10-22 30-34.5t43-12.5h376q23 0 43 12.5t30 34.5l139 313H80Z",  // point_of_sale
            // retail — 가방, 선반, 상점
            "convenience-small": "MAT:M841-518v318q0 33-23.5 56.5T761-120H201q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518Z",  // storefront
            "lifestyle-goods": "MAT:M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720Z",                                                   // 쇼핑백 + 하트
            "beauty-supplies": "MAT:M480-80q-73-9-145-39.5T206.5-207Q150-264 115-351T80-560v-40h40q51 0 105 13t101 39q12-86 54.5-176.5T480-880q57 65 99.5 155.5T634-548q47-26 101-39t105-13h40v40q0 122-35 209t-91.5 144q-56.5 57-128 87.5T480-80Z",                     // 화장품 병
            "fashion-accessories": "MAT:M120-160q-17 0-28.5-11.5T80-200q0-10 4-18.5T96-232l344-258v-70q0-17 12-28.5t29-11.5q25 0 42-18t17-43q0-25-17.5-42T480-720q-25 0-42.5 17.5T420-660h-80q0-58 41-99t99-41q58 0 99 40.5t41 98.5q0 47-27.5 84T520-526v36l344 258q8 5 12 13.5t4 18.5q0 17-11.5 28.5T840-160H120Z",                // 옷걸이/가방
            "health-food-store": "MAT:M281.5-201.5Q200-283 200-400q0-94 55.5-168.5T401-669q-20-5-39-14.5T328-708q-33-33-42.5-78.5T281-879q47-5 92.5 4.5T452-832q23 23 33.5 52t13.5 61q13-31 31.5-58.5T572-828q11-11 28-11t28 11q11 11 11 28t-11 28q-22 22-39 48.5T564-667q88 28 142 101.5T760-400q0 117-81.5 198.5T480-120q-117 0-198.5-81.5Z",                                        // 건강식품 병
            "unmanned-retail": "MAT:M120-200q-33 0-56.5-23.5T40-280v-400q0-33 23.5-56.5T120-760h124q7-18 22-29t34-11h80q19 0 34 11t22 29h404q33 0 56.5 23.5T920-680v400q0 33-23.5 56.5T840-200H120Z", // 무인 키오스크
            // beauty — 가위, 브러시, 거울
            "hair-salon": "MAT:M760-120 480-400l-94 94q8 15 11 32t3 34q0 66-47 113T240-80q-66 0-113-47T80-240q0-66 47-113t113-47q17 0 34 3t32 11l94-94-94-94q-15 8-32 11t-34 3q-66 0-113-47T80-720q0-66 47-113t113-47q66 0 113 47t47 113q0 17-3 34t-11 32l494 494v40H760Z",  // content_cut (가위)
            "nail-studio": "MAT:M240-120q-45 0-89-22t-71-58q26 0 53-20.5t27-59.5q0-50 35-85t85-35q50 0 85 35t35 85q0 66-47 113t-113 47Zm230-160L360-470l358-358q11-11 27.5-11.5T774-828l54 54q12 12 12 28t-12 28L470-360Z",  // brush (브러시/네일)
            "skin-care-room": "MAT:M324.5-324.5Q310-339 310-360t14.5-35.5Q339-410 360-410t35.5 14.5Q410-381 410-360t-14.5 35.5Q381-310 360-310t-35.5-14.5Zm240 0Q550-339 550-360t14.5-35.5Q579-410 600-410t35.5 14.5Q650-381 650-360t-14.5 35.5Q621-310 600-310t-35.5-14.5ZM480-80q134 0 227-93t93-227q0-24-3-46.5T786-490q-21 5-42 7.5t-44 2.5q-91 0-172-39T390-628q-32 78-91.5 135.5T160-406v6q0 134 93 227t227 93Z",                          // 얼굴/스파
            "waxing-studio": "MAT:M480-80q-73-9-145-39.5T206.5-207Q150-264 115-351T80-560v-40h40q51 0 105 13t101 39q12-86 54.5-176.5T480-880q57 65 99.5 155.5T634-548q47-26 101-39t105-13h40v40q0 122-35 209t-91.5 144q-56.5 57-128 87.5T480-80Z",                                       // 왁싱 추상
            "eyelash-brow": "MAT:M480-320q-75 0-127.5-52.5T300-500q0-75 52.5-127.5T480-680t127.5 52.5Q660-575 660-500t-52.5 127.5T480-320Zm0-72q46 0 77-31t31-77-31-77-77-31-77 31-31 77 31 77 77 31ZM480-500ZM480-200q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z",          // 눈
            "makeup-bridal": "MAT:M324.5-324.5Q310-339 310-360t14.5-35.5Q339-410 360-410t35.5 14.5Q410-381 410-360t-14.5 35.5Q381-310 360-310t-35.5-14.5Zm240 0Q550-339 550-360t14.5-35.5Q579-410 600-410t35.5 14.5Q650-381 650-360t-14.5 35.5Q621-310 600-310t-35.5-14.5ZM480-80q134 0 227-93t93-227q0-24-3-46.5T786-490q-21 5-42 7.5t-44 2.5q-91 0-172-39T390-628q-32 78-91.5 135.5T160-406v6q0 134 93 227t227 93Z",                                  // 거울/화장대
            // fitness — 운동 기구
            "pilates-studio": "MAT:M272-160q-30 0-51-21t-21-51q0-21 12-39.5t32-26.5l156-62v-90q-54 63-125.5 96.5T120-320v-80q68 0 123.5-28T344-508l54-64q12-14 28-21t34-7h40q18 0 34 7t28 21l54 64q45 52 100.5 80T840-400v80q-83 0-154.5-33.5T560-450v90l156 62q20 8 32 26.5t12 39.5q0 30-21 51t-51 21H400v-20q0-26 17-43t43-17h120q9 0 14.5-5.5T600-260q0-9-5.5-14.5T580-280H460q-42 0-71 29t-29 71v20h-88Z",                                       // 필라테스 자세
            "pt-gym": "MAT:m536-84-56-56 142-142-340-340-142 142-56-56 56-58-56-56 84-84-56-58 56-56 58 56 84-84 56 56 58-56 56 56-142 142 340 340 142-142 56 56-56 58 56 56-84 84 56 58-56 56-58-56-84 84-56-56-58 56Z",  // fitness_center
            "yoga-studio": "MAT:m400-80-20-360-127-73-14 52 81 141-69 40-99-170 48-172 230-132-110-110 56-56 184 183-144 83 48 42 328-268 48 56-340 344-20 400h-80ZM200-680q-33 0-56.5-23.5T120-760q0-33 23.5-56.5T200-840q33 0 56.5 23.5T280-760q0 33-23.5 56.5T200-680Z",                                         // 요가 자세
            "crossfit-box": "MAT:m826-585-56-56 30-31-128-128-31 30-57-57 30-31q23-23 57-22.5t57 23.5l129 129q23 23 23 56.5T857-615l-31 30ZM346-104q-23 23-56.5 23T233-104L104-233q-23-23-23-56.5t23-56.5l30-30 57 57-31 30 129 129 30-31 57 57-30 30Z",                                    // 무거운 바벨
            "golf-studio": "MAT:M440-80v-40q0-33-23.5-56.5T360-200h-80v-80h400v80h-80q-33 0-56.5 23.5T520-120v40h-80Zm40-520Zm0 120q-66 0-113-47t-47-113 47-113 113-47 113 47 47 113-47 113-113 47Z",                                     // 골프 공+티
            "unmanned-fitness": "MAT:m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z",                            // 24시간 운동기구
            // education — 책, 연필, 학교
            "study-room": "MAT:M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Z",  // school
            "kids-academy": "MAT:M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Z",  // school (학교)
            "adult-class": "MAT:M480-160q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740v484q51-32 107-48t113-16q36 0 70.5 6t69.5 18v-480q15 5 29.5 10.5T898-752q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Z",                                                     // 책상+창문(교실)
            "language-academy": "MAT:m476-80 182-480h84L924-80h-84l-43-122H603L560-80h-84ZM160-200l-56-56 202-202q-35-35-63.5-80T190-640h84q20 39 40 68t48 58q33-33 68.5-92.5T484-720H40v-80h280v-80h80v80h280v80H564q-21 72-63 148t-83 116l96 98-30 82-122-125-202 201Z",                                          // 언어(가나다/ABC)
            "coding-class": "MAT:M320-240 80-480l240-240 57 57-184 184 183 183-56 56Zm320 0-57-57 184-184-183-183 56-56 240 240-240 240Z",                                                             // 코드 꺽쇠 + 슬래시
            "small-study-room": "MAT:M560-564v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-600q-38 0-73 9.5T560-564Zm0 220v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-380q-38 0-73 9t-67 27Zm0-110v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-490q-38 0-73 9.5T560-454ZM260-320q47 0 91.5 10.5T440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6Z",                    // 책상+의자
            // pet — 발바닥, 뼈, 동물
            "pet-grooming": "MAT:M180-475q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Zm109-189q-29-29-29-71t29-71q29-29 71-29t71 29q29 29 29 71t-29 71q-29 29-71 29t-71-29Zm240 0q-29-29-29-71t29-71q29-29 71-29t71 29q29 29 29 71t-29 71q-29 29-71 29t-71-29Zm251 189q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM266-75q-45 0-75.5-34.5T160-191q0-52 35.5-91t70.5-77q29-31 50-67.5t50-68.5q22-26 51-43t63-17q34 0 63 16t51 42q28 32 49.5 69t50.5 69q35 38 70.5 77t35.5 91q0 47-30.5 81.5T694-75q-54 0-107-9t-107-9q-54 0-107 9t-107 9Z",  // pets (발바닥)
            "pet-supplies": "MAT:M200-80q-33 0-56.5-23.5T120-160v-451q-18-11-29-28.5T80-680v-120q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v120q0 23-11 40.5T840-611v451q0 33-23.5 56.5T760-80H200Zm0-520v440h560v-440H200Zm-40-80h640v-120H160v120Zm200 280h240v-80H360v80Z",                              // 사료 봉투
            "pet-hotel": "MAT:M200-160v-366L88-440l-48-64 440-336 160 122v-82h120v174l160 122-48 64-112-86v366H520v-240h-80v240H200Z",                                                               // 집(펫호텔)
            "pet-cafe": "MAT:M160-120v-80h640v80H160Zm160-160q-66 0-113-47t-47-113v-400h640q33 0 56.5 23.5T880-760v120q0 33-23.5 56.5T800-560h-80v120q0 66-47 113t-113 47H320Z",                                      // 컵(펫카페)
            "pet-training-school": "MAT:M206-206q-41-48-63.5-107.5T120-440q0-150 105-255t255-105h8l-64-64 56-56 160 160-160 160-57-57 63-63h-6q-116 0-198 82t-82 198q0 51 16.5 96t46.5 81l-57 57Z",                                     // 학교+발바닥
            "pet-walking-visit": "MAT:m280-40 112-564-72 28v136h-80v-188l202-86q14-6 29.5-7t29.5 4q14 5 26.5 14t20.5 23l40 64q26 42 70.5 69T760-520v80q-70 0-125-29t-94-74l-25 123 84 80v300h-80v-260l-84-64-72 324h-84Z",                       // 산책하는 사람
            // living — 도구, 서비스
            "laundry-service": "MAT:M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-640H240v640Zm241.5-98.5Q540-317 540-400t-58.5-141.5Q480-600 480-600t-141.5 58.5Q280-483 280-400t58.5 141.5Z", // 세탁기
            "cleaning-service": "MAT:M120-40v-280q0-83 58.5-141.5T320-520h40v-320q0-33 23.5-56.5T440-920h80q33 0 56.5 23.5T600-840v320h40q83 0 141.5 58.5T840-320v280H120Z",                                               // 빗자루
            "repair-service": "MAT:M756-120 537-339l84-84 219 219-84 84Zm-552 0-84-84 276-276-68-68-28 28-51-51v82l-28 28-121-121 28-28h82l-50-50 142-142q20-20 43-29t47-9q24 0 47 9t43 29l-92 92 50 50-28 28 68 68 90-90q-4-11-6.5-23t-2.5-24q0-59 40.5-99.5T701-841q15 0 28.5 3t27.5 9l-99 99 72 72 99-99q7 14 9.5 27.5T841-701q0 59-40.5 99.5T701-561q-12 0-24-2t-23-7L204-120Z", // 렌치
            "self-laundry": "MAT:M280-80v-240h-64q-40 0-68-28t-28-68q0-29 16-53.5t42-36.5l262-116v-26q-36-13-58-43.5T360-760q0-50 35-85t85-35q50 0 85 35t35 85h-80q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760q0 17 11.5 28.5T480-720t28.5 11.5Q520-697 520-680v58l262 116q26 12 42 36.5t16 53.5q0 40-28 68t-68 28h-64v240H280Z", // 코인세탁기
            "print-copy": "MAT:M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Z",  // 프린터
            "device-repair": "MAT:M280-40q-33 0-56.5-23.5T200-120v-720q0-33 23.5-56.5T280-920h400q33 0 56.5 23.5T760-840v124q18 7 29 22t11 34v80q0 19-11 34t-29 22v404q0 33-23.5 56.5T680-40H280Z",               // 스마트폰
            // space — 건물, 방
            "guesthouse": "MAT:M40-200v-600h80v400h320v-320h320q66 0 113 47t47 113v360h-80v-120H120v120H40Z",                                                             // 게스트하우스
            "rental-studio": "MAT:M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Z",    // 카메라/스튜디오
            "party-room": "MAT:m80-80 200-560 360 360L80-80Zm132-132 282-100-182-182-100 282Z", // 파티 (스파클)
            "study-cafe-space": "MAT:M160-120v-80h640v80H160Zm160-160q-66 0-113-47t-47-113v-400h640q33 0 56.5 23.5T880-760v120q0 33-23.5 56.5T800-560h-80v120q0 66-47 113t-113 47H320Z",                // 스터디카페 컵+책
            "shared-office": "MAT:M120-120v-560h160v-160h400v320h160v400H520v-160h-80v160H120Zm80-80h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 320h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 480h80v-80h-80v80Zm0-160h80v-80h-80v80Z",            // 빌딩
            "practice-room": "MAT:M287-167q-47-47-47-113t47-113q47-47 113-47 23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47q-66 0-113-47Z",                   // 음표
            // online — 화면, 카트, 클라우드
            "smart-store": "MAT:M223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Z",            // 스마트스토어 화면
            "digital-products": "MAT:M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q17-72 85-137t145-65q33 0 56.5 23.5T520-716v242l64-62 56 56-160 160-160-160 56-56 64 62v-242q-76 14-118 73.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41h480q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-48-22-89.5T600-680v-93q74 35 117 103.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H260Z",                  // 클라우드 다운로드
            "creator-service": "MAT:M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Z",  // 영상 카메라
            "consignment-commerce": "MAT:M155-195q-35-35-35-85H40v-440q0-33 23.5-56.5T120-800h560v160h120l120 160v200h-80q0 50-35 85t-85 35q-50 0-85-35t-35-85H360q0 50-35 85t-85 35q-50 0-85-35Z",           // 장바구니
            "newsletter-membership": "MAT:M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200Z",         // 봉투/메일
            "global-buying": "MAT:M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z", // 지구본
            // startup — 기술, 코드, 차트
            "ai-application": "MAT:m760-600-50-110-110-50 110-50 50-110 50 110 110 50-110 50-50 110Zm0 560-50-110-110-50 110-50 50-110 50 110 110 50-110 50-50 110ZM360-160 260-380 40-480l220-100 100-220 100 220 220 100-220 100-100 220Z",                                            // AI 스파크
            "developer-tools": "MAT:M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H160v400Zm140-40-56-56 103-104-104-104 57-56 160 160-160 160Zm180 0v-80h240v80H480Z",                                                          // 코드 </>
            "b2b-saas": "MAT:M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Z",              // 대시보드
            "fintech-startup": "MAT:M200-280v-280h80v280h-80Zm240 0v-280h80v280h-80ZM80-120v-80h800v80H80Zm600-160v-280h80v280h-80ZM80-640v-80l400-200 400 200v80H80Z",                                          // 달러 기호
            "healthtech-startup": "MAT:M80-600v-120q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v120h-80v-120H160v120H80Zm80 440q-33 0-56.5-23.5T80-240v-120h80v120h640v-120h80v120q0 33-23.5 56.5T800-160H160Zm261-125.5q10-5.5 15-16.5l124-248 44 88q5 11 15 16.5t21 5.5h240v-80H665l-69-138q-5-11-15-15.5t-21-4.5q-11 0-21 4.5T524-658L400-410l-44-88q-5-11-15-16.5t-21-5.5H80v80h215l69 138q5 11 15 16.5t21 5.5q11 0 21-5.5Z",                                                                             // 십자가 (의료)
            "security-startup": "MAT:M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q97-30 162-118.5T718-480H480v-315l-240 90v207q0 7 2 18h238v316Z",                                                   // 방패
          };

          // 업종별 테마 색상
          const industryColors: Record<string, string> = {
            // food — warm orange/red tones
            "korean-casual": "#e25822", "delivery-meals": "#d94f00", "salad-healthy": "#16a34a",
            "ramen-noodle": "#c2410c", "chicken-burger": "#dc2626", "western-pasta-brunch": "#b45309",
            // cafe — brown/warm tones
            "takeout-coffee": "#92400e", "specialty-coffee": "#78350f", "dessert-cafe": "#db2777",
            "bakery-studio": "#a16207", "icecream-bingsu": "#0891b2", "self-serve-cafe": "#6366f1",
            // retail — blue/teal
            "convenience-small": "#0d9488", "lifestyle-goods": "#7c3aed", "beauty-supplies": "#db2777",
            "fashion-accessories": "#9333ea", "health-food-store": "#16a34a", "unmanned-retail": "#4f46e5",
            // beauty — pink/rose
            "hair-salon": "#be185d", "nail-studio": "#e11d48", "skin-care-room": "#ec4899",
            "waxing-studio": "#d946ef", "eyelash-brow": "#c026d3", "makeup-bridal": "#a21caf",
            // fitness — energetic blues/greens
            "pilates-studio": "#0ea5e9", "pt-gym": "#1d4ed8", "yoga-studio": "#0d9488",
            "crossfit-box": "#dc2626", "golf-studio": "#059669", "unmanned-fitness": "#6366f1",
            // education — calm blues
            "study-room": "#2563eb", "kids-academy": "#f59e0b", "adult-class": "#7c3aed",
            "language-academy": "#0891b2", "coding-class": "#4f46e5", "small-study-room": "#1d4ed8",
            // pet — warm friendly
            "pet-grooming": "#ea580c", "pet-supplies": "#16a34a", "pet-hotel": "#0891b2",
            "pet-cafe": "#92400e", "pet-training-school": "#d97706", "pet-walking-visit": "#059669",
            // living — functional teal/gray
            "laundry-service": "#0d9488", "cleaning-service": "#2563eb", "repair-service": "#b45309",
            "self-laundry": "#0891b2", "print-copy": "#64748b", "device-repair": "#4f46e5",
            // space — indigo/purple
            "guesthouse": "#7c3aed", "rental-studio": "#6366f1", "party-room": "#ec4899",
            "study-cafe-space": "#1d4ed8", "shared-office": "#0f172a", "practice-room": "#9333ea",
            // online — modern purple/blue
            "smart-store": "#2563eb", "digital-products": "#7c3aed", "creator-service": "#ec4899",
            "consignment-commerce": "#0891b2", "newsletter-membership": "#6366f1", "global-buying": "#059669",
            // startup — tech blue/indigo
            "ai-application": "#7c3aed", "developer-tools": "#0f172a", "b2b-saas": "#2563eb",
            "fintech-startup": "#059669", "healthtech-startup": "#dc2626", "security-startup": "#1e40af",
          };

          return starterIndustryOptions
            .filter((option) => option.meta?.categoryId === selectedIndustryCategoryId)
            .slice(0, 6)
            .map((rawOption) => {
            const option = localizeRecommendationItem(rawOption, language);
            const selected = selectedIndustryId === rawOption.id;
            const iconPath = industryIcons[rawOption.id];
            const color = industryColors[rawOption.id] ?? "#1d3557";
            return (
              <button
                key={rawOption.id}
                type="button"
                style={{
                  ...styles.optionCard,
                  background: selected
                    ? `linear-gradient(160deg, ${color}14 0%, ${color}08 100%)`
                    : `linear-gradient(160deg, ${color}06 0%, rgba(255,255,255,0.9) 100%)`,
                  border: selected ? `1.5px solid ${color}40` : `1.5px solid ${color}10`,
                  boxShadow: selected ? `0 0 0 3px ${color}10, 0 4px 12px ${color}0c` : "none",
                }}
                onClick={() => setSelectedIndustryId(rawOption.id)}
              >
                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  background: selected ? `${color}18` : `${color}0a`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "8px",
                  transition: "all 0.2s ease",
                }}>
                  {iconPath?.startsWith("MAT:") ? (
                    <svg width="24" height="24" viewBox="0 -960 960 960"
                      fill={selected ? color : `${color}80`}
                      style={{ transition: "fill 0.2s ease" }}>
                      <path d={iconPath.slice(4)} />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke={selected ? color : `${color}80`}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition: "stroke 0.2s ease" }}>
                      <path d={iconPath ?? "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"} />
                    </svg>
                  )}
                </div>
                <div style={{ ...styles.optionTitle, textAlign: "center" as const, color: selected ? color : "#0f172a" }}>{option.title}</div>
              </button>
            );
          });
        })()}
      </div>

      <div style={styles.stageFooter}>
        {prevTraversedStage ? (
          <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
            {language === "ko" ? "← 이전 단계" : "← Back"}
          </button>
        ) : null}
        <button
          type="button"
          style={{ ...styles.primaryButton, opacity: canCompleteIndustryStep ? 1 : 0.7 }}
          onClick={() => {
            if (!canCompleteIndustryStep) {
              setShakeWarning(true);
              optionGridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleIndustryContinue();
          }}
        >
          {canCompleteIndustryStep
            ? (language === "ko" ? "이 업종으로 다음 단계" : "Use this industry and continue")
            : (language === "ko" ? "↑ 세부 업종을 선택하세요" : "↑ Select a sub-industry")}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
