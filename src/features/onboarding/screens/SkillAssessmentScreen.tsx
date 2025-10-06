import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useOnboarding } from '../OnboardingContext';
import { Svg, Path, G } from 'react-native-svg';
import { PickleballQuestionnaire, Question, QuestionnaireResponse, SkillQuestions } from '../services/PickleballQuestionnaire';
import { TennisQuestionnaire, TennisQuestion, TennisQuestionnaireResponse, TennisSkillQuestions } from '../services/TennisQuestionnaire';
import { PadelQuestionnaire, PadelQuestion, PadelQuestionnaireResponse, PadelSkillQuestions } from '../services/PadelQuestionnaire';
import { OptionButton, NumberInput, QuestionContainer, BackgroundGradient } from '../components';
import { LoadingSpinner } from '@/shared/components/ui';
import { useSession } from '@/lib/auth-client';
import type { SportType } from '../types';
import { toast } from 'sonner-native';

const ChevronDown = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 10L12 15L17 10"
      stroke="#6C7278"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Sport Icons with faded yellow-orange color
const PickleballIcon = () => (
  <Svg width="70" height="70" viewBox="0 0 64 64" fill="none">
    <G>
      <G fill="#F8F3FF">
        <Path d="M6.519 33.26a1.5 1.5 0 0 1-1.461-1.166C.346 11.497 12.714 4.013 13.243 3.704a1.5 1.5 0 0 1 1.516 2.59c-.477.284-10.97 6.8-6.778 25.131A1.5 1.5 0 0 1 6.52 33.26zM17 15.5a1.5 1.5 0 0 1-1.5-1.5c-.001-6.771 5.493-10.146 5.728-10.286a1.5 1.5 0 0 1 1.548 2.57C22.6 6.391 18.5 8.96 18.5 14a1.5 1.5 0 0 1-1.5 1.5z" fill="#F8F3FF" opacity="1"/>
        <Path d="M13.17 26.61a1.5 1.5 0 0 1-1.326-.799c-2.444-4.62-.942-9.194-.876-9.387a1.499 1.499 0 1 1 2.842.962c-.01.029-1.14 3.572.686 7.023a1.5 1.5 0 0 1-1.325 2.201zM28.52 19.21c-.263 0-.529-.07-.771-.214-4.985-2.988-4.674-7.66-2.893-10.754a1.5 1.5 0 0 1 2.6 1.497c-.719 1.248-1.978 4.398 1.836 6.684a1.5 1.5 0 0 1-.772 2.786zM22.768 43.452a1.5 1.5 0 0 1-.197-2.987l3.584-.478a1.5 1.5 0 1 1 .396 2.974l-3.583.478a1.543 1.543 0 0 1-.2.013zM27.482 36.565c-.272 0-.546-.074-.794-.228l-2.996-1.873a1.499 1.499 0 1 1 1.59-2.544l2.996 1.873a1.499 1.499 0 0 1-.796 2.772zM32.259 32.245a1.5 1.5 0 0 1-1.38-.91l-1.15-2.688a1.5 1.5 0 1 1 2.758-1.18l1.15 2.688a1.5 1.5 0 0 1-1.378 2.09z" fill="#F8F3FF" opacity="1"/>
        <Path d="M22.549 54.498c-1.171 0-2.35-.302-3.414-.922-6.609-3.826-10.872-8.09-14.713-14.714-1.536-2.66-1.11-6.016 1.037-8.163l13.29-13.29a6.837 6.837 0 0 1 6.047-1.895l10.48 1.89a1.5 1.5 0 0 1-.533 2.952l-10.48-1.89a3.843 3.843 0 0 0-3.393 1.065L7.58 32.82c-1.187 1.187-1.419 3.054-.561 4.539 3.601 6.212 7.42 10.032 13.622 13.621 1.48.862 3.35.63 4.551-.565l7.456-7.466a1.5 1.5 0 1 1 2.123 2.12l-7.46 7.47a6.75 6.75 0 0 1-4.762 1.958zM40.202 30.5a1.5 1.5 0 0 1-1.474-1.234l-1.084-6.01a1.501 1.501 0 0 1 2.953-.532l1.084 6.01a1.501 1.501 0 0 1-1.479 1.766z" fill="#F8F3FF" opacity="1"/>
        <Path d="M39.116 24.493c-.384 0-.767-.146-1.06-.44l-4.109-4.108a1.5 1.5 0 0 1 0-2.12l11.069-11.07.643-1.715a2.37 2.37 0 0 1 3.897-.844l4.249 4.248c.572.573.812 1.387.641 2.179a2.364 2.364 0 0 1-1.484 1.718l-1.716.644-11.07 11.069c-.292.293-.676.44-1.06.44zm-1.987-5.608 1.987 1.987 10.238-10.238c.152-.152.333-.269.535-.344l1.105-.415-2.868-2.869-.415 1.106a1.5 1.5 0 0 1-.344.534zm9.178-11.3h.01zm2.16-1.492z" fill="#F8F3FF" opacity="1"/>
        <Path d="M43.626 19.984c-.384 0-.768-.146-1.06-.44l-4.11-4.11a1.5 1.5 0 1 1 2.12-2.12l4.11 4.11a1.5 1.5 0 0 1-1.06 2.56zM48.026 15.585c-.383 0-.767-.147-1.06-.44l-4.11-4.11a1.5 1.5 0 1 1 2.12-2.121l4.11 4.11a1.5 1.5 0 0 1-1.06 2.561z" fill="#F8F3FF" opacity="1"/>
      </G>
      <Path fill="#C89AFF" d="M46.255 32.01c-7.855 0-14.244 6.39-14.244 14.245S38.4 60.5 46.255 60.5 60.5 54.11 60.5 46.255s-6.39-14.244-14.245-14.244zm-5.409 17.054a2 2 0 1 1-3.912-.831 2 2 0 0 1 3.912.831zm1.066-7.085a2 2 0 1 1-.418-3.978 2 2 0 0 1 .418 3.978zm6.075 13.02a2 2 0 1 1-3.464-2 2 2 0 0 1 3.464 2zm0-7.744a2 2 0 1 1-3.464-2 2 2 0 0 1 3.464 2zm.993-6.452a2 2 0 1 1 3.654-1.627 2 2 0 0 1-3.654 1.627zm5.979 9.332a2 2 0 1 1-2.677-2.973 2 2 0 0 1 2.677 2.973z" opacity="1"/>
    </G>
  </Svg>
);

const TennisIcon = () => (
  <Svg width="88" height="87" viewBox="0 0 53 52" fill="none">
    <Path
      d="M0.702515 22.8526C1.40069 17.0866 4.0112 11.721 8.117 7.61294C12.2228 3.50488 17.587 0.891411 23.3525 0.190049C23.489 0.173751 23.6275 0.185783 23.7591 0.225394C23.8908 0.265004 24.0129 0.331341 24.1178 0.420261C24.2226 0.50918 24.308 0.618772 24.3686 0.742189C24.4293 0.865605 24.4638 1.00019 24.47 1.13755C24.5937 4.16775 24.0882 7.1907 22.9855 10.0158C21.8827 12.841 20.2067 15.407 18.0629 17.5522C15.9192 19.6973 13.3542 21.3751 10.5298 22.4797C7.70541 23.5843 4.68279 24.0917 1.65252 23.97C1.51495 23.9641 1.38008 23.9299 1.25637 23.8694C1.13266 23.8089 1.02277 23.7236 0.933581 23.6187C0.844395 23.5138 0.777837 23.3916 0.738076 23.2597C0.698315 23.1279 0.686208 22.9893 0.702515 22.8526ZM51.3375 28.0275C51.0575 28.0275 50.78 28.01 50.5 28.01C47.5387 28.0063 44.6072 28.6014 41.8818 29.7598C39.1564 30.9182 36.6935 32.6158 34.6411 34.7506C32.5888 36.8854 30.9894 39.4133 29.9392 42.1821C28.889 44.951 28.4097 47.9037 28.53 50.8625C28.5363 50.9999 28.5708 51.1345 28.6314 51.2579C28.692 51.3813 28.7774 51.4909 28.8823 51.5798C28.9871 51.6688 29.1092 51.7351 29.2409 51.7747C29.3726 51.8143 29.511 51.8263 29.6475 51.8101C35.4135 51.1086 40.7779 48.4947 44.8837 44.3862C48.9896 40.2776 51.5999 34.9115 52.2975 29.1451C52.3139 29.0075 52.3015 28.8681 52.2611 28.7356C52.2207 28.6031 52.1533 28.4804 52.063 28.3754C51.9728 28.2703 51.8617 28.1852 51.7368 28.1253C51.6119 28.0654 51.4759 28.0321 51.3375 28.0275ZM32.115 31.6151C34.5239 29.1933 37.3891 27.2733 40.5448 25.9662C43.7006 24.6591 47.0843 23.9908 50.5 24H51.2725C51.4159 24.0052 51.5587 23.9794 51.6912 23.9245C51.8238 23.8696 51.9429 23.7868 52.0406 23.6817C52.1383 23.5767 52.2123 23.4518 52.2575 23.3156C52.3027 23.1795 52.318 23.0352 52.3025 22.8925C51.6132 17.1055 48.998 11.7183 44.8772 7.59703C40.7564 3.4758 35.3695 0.859958 29.5825 0.170049C29.4399 0.154534 29.2956 0.16989 29.1594 0.215075C29.0233 0.26026 28.8984 0.334216 28.7934 0.431921C28.6883 0.529626 28.6055 0.648793 28.5506 0.781331C28.4956 0.913868 28.4699 1.05667 28.475 1.20005C28.5887 4.7454 27.9738 8.27637 26.6683 11.5746C25.3628 14.8727 23.3944 17.868 20.885 20.375C18.477 22.7986 15.6122 24.7205 12.4564 26.0293C9.30055 27.3381 5.91646 28.008 2.50002 28H1.72751C1.58414 27.9949 1.44133 28.0207 1.3088 28.0756C1.17626 28.1305 1.05709 28.2133 0.959387 28.3184C0.861682 28.4234 0.787726 28.5483 0.742541 28.6845C0.697356 28.8206 0.682 28.9649 0.697515 29.1075C1.38679 34.8946 4.00204 40.2818 8.12282 44.4031C12.2436 48.5243 17.6305 51.1401 23.4175 51.8301C23.5601 51.8456 23.7044 51.8302 23.8406 51.785C23.9768 51.7398 24.1016 51.6659 24.2067 51.5682C24.3117 51.4705 24.3945 51.3513 24.4495 51.2188C24.5044 51.0862 24.5302 50.9434 24.525 50.8C24.4099 47.253 25.0242 43.7202 26.3297 40.4202C27.6353 37.1202 29.6044 34.1233 32.115 31.6151Z"
      fill="#F4ECDC"
    />
  </Svg>
);

const PadelIcon = () => (
  <Svg width="88" height="87" viewBox="0 0 59 54" fill="none">
    <Path
      d="M47.1 53.6667L31.5667 38.2L29.7 40.0667C28.6778 41.0889 27.5115 41.8667 26.2013 42.4C24.8911 42.9334 23.5462 43.2 22.1667 43.2C20.7871 43.2 19.4315 42.9334 18.1 42.4C16.7684 41.8667 15.5907 41.0889 14.5667 40.0667L3.29999 28.7334C2.27777 27.7111 1.49999 26.5449 0.966656 25.2347C0.433323 23.9245 0.166656 22.5796 0.166656 21.2C0.166656 19.8205 0.433323 18.4765 0.966656 17.168C1.49999 15.8596 2.27777 14.6925 3.29999 13.6667L10.8333 6.13337C11.8555 5.11115 13.0227 4.33337 14.3347 3.80004C15.6467 3.26671 16.9907 3.00004 18.3667 3.00004C19.7427 3.00004 21.0875 3.26671 22.4013 3.80004C23.7151 4.33337 24.8813 5.11115 25.9 6.13337L37.2333 17.4C38.2555 18.4223 39.0333 19.6 39.5667 20.9334C40.1 22.2667 40.3667 23.6223 40.3667 25C40.3667 26.3778 40.1 27.7227 39.5667 29.0347C39.0333 30.3467 38.2555 31.5129 37.2333 32.5334L35.3667 34.4L50.8333 49.9334L47.1 53.6667ZM22.1667 37.8667C22.8333 37.8667 23.4893 37.7449 24.1347 37.5014C24.78 37.2578 25.3684 36.8685 25.9 36.3334L33.5 28.7334C34.0333 28.2445 34.4227 27.6667 34.668 27C34.9133 26.3334 35.0351 25.6667 35.0333 25C35.0315 24.3334 34.9098 23.6667 34.668 23C34.4262 22.3334 34.0369 21.7334 33.5 21.2L22.1667 9.93337C21.6778 9.40004 21.1 9.00004 20.4333 8.73337C19.7667 8.46671 19.1 8.33337 18.4333 8.33337C17.7667 8.33337 17.1 8.46671 16.4333 8.73337C15.7667 9.00004 15.1667 9.40004 14.6333 9.93337L7.09999 17.4667C6.56666 18 6.17821 18.5894 5.93466 19.2347C5.6911 19.88 5.56843 20.5352 5.56666 21.2C5.56488 21.8649 5.68755 22.5316 5.93466 23.2C6.18177 23.8685 6.57021 24.4685 7.09999 25L18.4333 36.3334C18.9222 36.8667 19.5 37.256 20.1667 37.5014C20.8333 37.7467 21.5 37.8685 22.1667 37.8667ZM11.3 24.6C11.8778 24.6 12.356 24.4116 12.7347 24.0347C13.1133 23.6578 13.3018 23.1796 13.3 22.6C13.2982 22.0205 13.1098 21.5431 12.7347 21.168C12.3595 20.7929 11.8813 20.6036 11.3 20.6C10.7187 20.5965 10.2413 20.7858 9.86799 21.168C9.49466 21.5503 9.30532 22.0276 9.29999 22.6C9.29466 23.1725 9.48399 23.6507 9.86799 24.0347C10.252 24.4187 10.7293 24.6072 11.3 24.6ZM15.5667 20.4C16.1444 20.4 16.6227 20.2116 17.0013 19.8347C17.38 19.4578 17.5684 18.9796 17.5667 18.4C17.5649 17.8205 17.3755 17.3432 16.9987 16.968C16.6218 16.5929 16.1444 16.4036 15.5667 16.4C14.9889 16.3965 14.5115 16.5858 14.1347 16.968C13.7578 17.3503 13.5684 17.8276 13.5667 18.4C13.5649 18.9725 13.7542 19.4507 14.1347 19.8347C14.5151 20.2187 14.9924 20.4072 15.5667 20.4ZM16.0333 29.3334C16.6111 29.3334 17.0893 29.144 17.468 28.7654C17.8467 28.3867 18.0351 27.9094 18.0333 27.3334C18.0315 26.7574 17.8422 26.28 17.4653 25.9014C17.0884 25.5227 16.6111 25.3334 16.0333 25.3334C15.4555 25.3334 14.9782 25.5227 14.6013 25.9014C14.2244 26.28 14.0351 26.7574 14.0333 27.3334C14.0315 27.9094 14.2209 28.3876 14.6013 28.768C14.9818 29.1485 15.4591 29.3369 16.0333 29.3334ZM19.7667 16.1334C20.3444 16.1334 20.8227 15.944 21.2013 15.5654C21.58 15.1867 21.7684 14.7094 21.7667 14.1334C21.7649 13.5574 21.5755 13.08 21.1987 12.7014C20.8218 12.3227 20.3444 12.1334 19.7667 12.1334C19.1889 12.1334 18.7115 12.3227 18.3347 12.7014C17.9578 13.08 17.7684 13.5574 17.7667 14.1334C17.7649 14.7094 17.9542 15.1876 18.3347 15.568C18.7151 15.9485 19.1924 16.1369 19.7667 16.1334ZM20.3 25.1334C20.8778 25.1334 21.3551 24.944 21.732 24.5654C22.1089 24.1867 22.2982 23.7094 22.3 23.1334C22.3018 22.5574 22.1124 22.08 21.732 21.7014C21.3515 21.3227 20.8742 21.1334 20.3 21.1334C19.7258 21.1334 19.2484 21.3227 18.868 21.7014C18.4875 22.08 18.2982 22.5574 18.3 23.1334C18.3018 23.7094 18.4911 24.1876 18.868 24.568C19.2449 24.9485 19.7222 25.1369 20.3 25.1334ZM20.7 34.0667C21.2778 34.0667 21.756 33.8774 22.1347 33.4987C22.5133 33.12 22.7018 32.6427 22.7 32.0667C22.6982 31.4907 22.5098 31.0134 22.1347 30.6347C21.7595 30.256 21.2813 30.0667 20.7 30.0667C20.1187 30.0667 19.6413 30.256 19.268 30.6347C18.8947 31.0134 18.7053 31.4907 18.7 32.0667C18.6947 32.6427 18.884 33.1209 19.268 33.5014C19.652 33.8818 20.1293 34.0703 20.7 34.0667ZM24.5 20.8667C25.0778 20.8667 25.556 20.6774 25.9347 20.2987C26.3133 19.92 26.5018 19.4427 26.5 18.8667C26.4982 18.2907 26.3089 17.8134 25.932 17.4347C25.5551 17.056 25.0778 16.8667 24.5 16.8667C23.9222 16.8667 23.4449 17.056 23.068 17.4347C22.6911 17.8134 22.5018 18.2907 22.5 18.8667C22.4982 19.4427 22.6875 19.9209 23.068 20.3014C23.4484 20.6818 23.9258 20.8703 24.5 20.8667ZM24.9667 29.8C25.5444 29.8 26.0227 29.6107 26.4013 29.232C26.78 28.8534 26.9684 28.376 26.9667 27.8C26.9649 27.224 26.7755 26.7467 26.3987 26.368C26.0218 25.9894 25.5444 25.8 24.9667 25.8C24.3889 25.8 23.9115 25.9894 23.5347 26.368C23.1578 26.7467 22.9684 27.224 22.9667 27.8C22.9649 28.376 23.1542 28.8543 23.5347 29.2347C23.9151 29.6152 24.3924 29.8036 24.9667 29.8ZM29.2333 25.5334C29.8111 25.5334 30.2893 25.3449 30.668 24.968C31.0467 24.5912 31.2351 24.1129 31.2333 23.5334C31.2315 22.9538 31.0422 22.4765 30.6653 22.1014C30.2884 21.7263 29.8111 21.5369 29.2333 21.5334C28.6555 21.5298 28.1782 21.7192 27.8013 22.1014C27.4244 22.4836 27.2351 22.9609 27.2333 23.5334C27.2315 24.1058 27.4209 24.584 27.8013 24.968C28.1818 25.352 28.6591 25.5405 29.2333 25.5334ZM49.5 19C46.9222 19 44.7222 18.0889 42.9 16.2667C41.0778 14.4445 40.1667 12.2445 40.1667 9.66671C40.1667 7.08893 41.0778 4.88893 42.9 3.06671C44.7222 1.24449 46.9222 0.333374 49.5 0.333374C52.0778 0.333374 54.2778 1.24449 56.1 3.06671C57.9222 4.88893 58.8333 7.08893 58.8333 9.66671C58.8333 12.2445 57.9222 14.4445 56.1 16.2667C54.2778 18.0889 52.0778 19 49.5 19ZM49.5 13.6667C50.6111 13.6667 51.556 13.2783 52.3347 12.5014C53.1133 11.7245 53.5018 10.7796 53.5 9.66671C53.4982 8.55382 53.1098 7.60982 52.3347 6.83471C51.5595 6.0596 50.6147 5.67026 49.5 5.66671C48.3853 5.66315 47.4413 6.05249 46.668 6.83471C45.8947 7.61693 45.5053 8.56093 45.5 9.66671C45.4947 10.7725 45.884 11.7174 46.668 12.5014C47.452 13.2854 48.396 13.6738 49.5 13.6667Z"
      fill="#F4ECDC"
    />
  </Svg>
);

const SkillAssessmentScreen = () => {
  const { sport, sportIndex } = useLocalSearchParams();
  const { data, updateData } = useOnboarding();
  const session = useSession(); // Get session at component level
  const currentSportIndex = parseInt(sportIndex as string) || 0;
  const selectedSports = data.selectedSports || [];
  
  // For non-pickleball sports, keep the simple dropdown
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 });
  const dropdownRef = useRef<View>(null);
  
  // For comprehensive questionnaires (pickleball, tennis, and padel)
  const [pickleballQuestionnaire] = useState(() => new PickleballQuestionnaire());
  const [tennisQuestionnaire] = useState(() => new TennisQuestionnaire());
  const [padelQuestionnaire] = useState(() => new PadelQuestionnaire());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionnaireResponse | TennisQuestionnaireResponse | PadelQuestionnaireResponse>({});
  const [questions, setQuestions] = useState<Question[] | TennisQuestion[] | PadelQuestion[]>([]);
  const [isComprehensiveQuestionnaire, setIsComprehensiveQuestionnaire] = useState(false);
  const [currentQuestionnaireType, setCurrentQuestionnaireType] = useState<'pickleball' | 'tennis' | 'padel' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [skillResponses, setSkillResponses] = useState<SkillQuestions | TennisSkillQuestions | PadelSkillQuestions>({});
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [forceShowQuestionnaire, setForceShowQuestionnaire] = useState(false);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [currentPageAnswers, setCurrentPageAnswers] = useState<{[key: string]: any}>({});
  const [questionHistory, setQuestionHistory] = useState<Array<{questions: Question[] | TennisQuestion[] | PadelQuestion[], responses: any}>>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Update navigation state for simple dropdown
  useEffect(() => {
    if (!isComprehensiveQuestionnaire) {
      // Navigation is always available for simple dropdown
    }
  }, [selectedOption, isComprehensiveQuestionnaire]);
  
  // Reset navigation when question changes
  useEffect(() => {
    if (isComprehensiveQuestionnaire) {
      // Navigation is handled within question cards
      setCurrentPageAnswers({});
    }
  }, [currentQuestionIndex, questions]);
  
  // Initialize question history when questionnaire starts
  useEffect(() => {
    if (isComprehensiveQuestionnaire && questions.length > 0 && questionHistory.length === 0) {
      setQuestionHistory([{
        questions: [...questions],
        responses: { ...responses }
      }]);
      setCurrentPageIndex(0);
      console.log('📖 Initialized question history with first page');
    }
  }, [isComprehensiveQuestionnaire, questions, questionHistory.length, responses]);

  // Initialize questionnaire based on sport
  useEffect(() => {
    if (sport === 'pickleball' || sport === 'tennis' || sport === 'padel') {
      setIsComprehensiveQuestionnaire(true);
      setCurrentQuestionnaireType(sport as 'pickleball' | 'tennis' | 'padel');
      setShowIntroduction(true);
      setForceShowQuestionnaire(false);
      
      const questionnaire = sport === 'pickleball' ? pickleballQuestionnaire : 
                           sport === 'tennis' ? tennisQuestionnaire : padelQuestionnaire;
      
      // Check if there's already a completed assessment
      const existingSkillData = data.skillAssessments?.[sport as SportType];
      if (existingSkillData && typeof existingSkillData === 'string') {
        // Check if it's the "answer_later" placeholder first
        if (existingSkillData === 'answer_later') {
          console.log('User previously chose to answer later, starting fresh assessment');
          setResponses({});
          setSkillResponses({});
          setCurrentQuestionIndex(0);
          setShowIntroduction(true);
          return;
        }
        
        try {
          const skillDataObject = JSON.parse(existingSkillData);
          // There's a complete assessment already, use its data
          const existingResponses = skillDataObject.responses || {};
          setResponses(existingResponses);
            
          // If assessment is complete, show introduction for retake
          if (skillDataObject.rating) {
            setResponses({});
            setSkillResponses({});
            setCurrentQuestionIndex(0);
            const initialQuestions = questionnaire.getConditionalQuestions({});
            setQuestions(initialQuestions);
          } else {
            // Continue incomplete assessment
            const nextQuestions = questionnaire.getConditionalQuestions(existingResponses);
            setQuestions(nextQuestions);
            setCurrentQuestionIndex(0);
          }
        } catch (error) {
          console.error('Failed to parse existing skill data:', error);
          // Start fresh if data is corrupted
          setResponses({});
          setSkillResponses({});
          setCurrentQuestionIndex(0);
          const initialQuestions = questionnaire.getConditionalQuestions({});
          setQuestions(initialQuestions);
        }
      } else {
        // No existing data, start fresh
        setResponses({});
        setSkillResponses({});
        setCurrentQuestionIndex(0);
        const initialQuestions = questionnaire.getConditionalQuestions({});
        setQuestions(initialQuestions);
      }
    } else {
      setIsComprehensiveQuestionnaire(false);
      setCurrentQuestionnaireType(null);
      // Load saved skill level for other sports
      if (data.skillAssessments && data.skillAssessments[sport as SportType]) {
        const skillData = data.skillAssessments[sport as SportType];
        if (skillData && typeof skillData === 'string' && skillData !== 'answer_later') {
          // Handle simple string skill levels
          setSelectedOption(skillData);
        } else {
          setSelectedOption(null);
        }
      } else {
        setSelectedOption(null);
      }
    }
  }, [sport, data.skillAssessments]);

  const skillOptions = [
    'Never played before',
    'Less than 1 month',
    '1-3 months',
    '3-6 months',
    '6-12 months',
    '1-2 years',
    '2-5 years',
    'More than 5 years',
  ];

  const handleConfirm = () => {
    if (isComprehensiveQuestionnaire) {
      // For comprehensive questionnaires, this shouldn't be called since we use the questionnaire flow
      return;
    }
    
    if (selectedOption) {
      // Update skill level for current sport (non-pickleball)
      const updatedSkillLevels = {
        ...data.skillAssessments,
        [sport as SportType]: selectedOption
      };
      updateData({ skillAssessments: updatedSkillLevels });
      proceedToNext();
    }
  };

  const measureDropdownPosition = () => {
    if (dropdownRef.current) {
      dropdownRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setDropdownPosition({
          x: pageX,
          y: pageY + height - 8,
          width: width
        });
      });
    }
  };

  const getSportTitle = () => {
    return typeof sport === 'string' ? sport.charAt(0).toUpperCase() + sport.slice(1) : '';
  };

  const getSportIcon = () => {
    switch (sport) {
      case 'pickleball':
        return <PickleballIcon />;
      case 'tennis':
        return <TennisIcon />;
      case 'padel':
        return <PadelIcon />;
      default:
        return null;
    }
  };

  const openDropdown = () => {
    measureDropdownPosition();
    setDropdownOpen(true);
  };

  const selectOption = (option: string) => {
    setSelectedOption(option);
    setDropdownOpen(false);
  };

  // Comprehensive questionnaire handlers
  const handleQuestionnaireResponse = (questionKey: string, answer: string | number | { [key: string]: string }) => {
    console.log('🎯 Question answered:', questionKey, answer);
    // Update current page answers instead of proceeding immediately
    const newPageAnswers = { ...currentPageAnswers, [questionKey]: answer };
    setCurrentPageAnswers(newPageAnswers);
    console.log('📝 Current page answers:', newPageAnswers);
    
    // Check if current question is fully answered
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      if (currentQuestion.type === 'skill_matrix' && currentQuestion.sub_questions) {
        // For skill matrix, check if all sub-questions are answered
        const allSkillKeys = Object.keys(currentQuestion.sub_questions);
        const answeredSkillKeys = Object.keys(skillResponses);
        const hasAllSkillAnswers = allSkillKeys.every(key => answeredSkillKeys.includes(key) || newPageAnswers[key]);
        console.log('🎯 Skill matrix check:', { allSkillKeys, answeredSkillKeys, hasAllSkillAnswers });
        // Navigation is handled within question cards
      } else {
        // For single questions, show navigation immediately
        console.log('✅ Single question answered - showing navigation');
        // Navigation is handled within question cards
      }
    }
  };

  const handleSkillResponse = (skillKey: string, answer: string) => {
    const newSkillResponses = { ...skillResponses, [skillKey]: answer };
    setSkillResponses(newSkillResponses);
    console.log('🎯 Skill answered:', skillKey, answer, 'All responses:', newSkillResponses);
    
    // Check if all skills are answered for current question
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion?.sub_questions) {
      const allSkillKeys = Object.keys(currentQuestion.sub_questions);
      const answeredKeys = Object.keys(newSkillResponses);
      
      console.log('🎯 Skill matrix progress:', { allSkillKeys, answeredKeys });
      
      if (allSkillKeys.every(key => answeredKeys.includes(key))) {
        // All skills answered, show navigation
        console.log('✅ All skills answered - showing navigation');
        // Navigation is handled within question cards
        // Store skill responses in current page answers
        setCurrentPageAnswers({ ...currentPageAnswers, skills: newSkillResponses });
      } else {
        // Not all skills answered yet, hide navigation
        console.log('⏳ Not all skills answered yet - hiding navigation');
        // Navigation is handled within question cards
      }
    }
  };

  const completePickleballAssessment = async (finalResponses: QuestionnaireResponse) => {
    setLoadingMessage('Calculating your pickleball rating...');
    setIsSubmittingAssessment(true);
    try {
      // Calculate rating using existing logic (for immediate UI feedback)
      const ratingResult = pickleballQuestionnaire.calculateInitialRating(finalResponses);
      
      // Store the complete responses and rating in context (for UI compatibility)
      const skillData = {
        responses: finalResponses,
        rating: ratingResult,
        feedback: pickleballQuestionnaire.generateFeedback(ratingResult)
      };
      
      const updatedSkillLevels = {
        ...data.skillAssessments,
        [sport as SportType]: JSON.stringify(skillData)
      };
      await updateData({ skillAssessments: updatedSkillLevels });

      // Save to backend
      try {
        await saveToBackend('pickleball', finalResponses);
      } catch (backendError) {
        console.warn('Failed to save to backend, but proceeding with local data:', backendError);
      }
      
      // Navigate directly to results without delay
      router.replace(`/onboarding/assessment-results?sport=${sport}&sportIndex=${currentSportIndex}`);
    } catch (error) {
      console.error('Error in completePickleballAssessment:', error);
      setIsSubmittingAssessment(false);
      toast.error('Error', {
        description: 'There was an issue calculating your rating. Using default assessment.',
      });
      proceedToNext();
    }
  };

  const completeTennisAssessment = async (finalResponses: TennisQuestionnaireResponse) => {
    setLoadingMessage('Calculating your tennis rating...');
    setIsSubmittingAssessment(true);
    try {
      // Calculate rating using existing logic
      const ratingResult = tennisQuestionnaire.calculateInitialRating(finalResponses);
      
      const skillData = {
        responses: finalResponses,
        rating: ratingResult,
        feedback: tennisQuestionnaire.generateFeedback(ratingResult)
      };
      
      const updatedSkillLevels = {
        ...data.skillAssessments,
        [sport as SportType]: JSON.stringify(skillData)
      };
      await updateData({ skillAssessments: updatedSkillLevels });

      // Save to backend
      try {
        await saveToBackend('tennis', finalResponses);
      } catch (backendError) {
        console.warn('Failed to save to backend, but proceeding with local data:', backendError);
      }
      
      // Navigate directly to results without delay
      router.replace(`/onboarding/assessment-results?sport=${sport}&sportIndex=${currentSportIndex}`);
    } catch (error) {
      console.error('Error in completeTennisAssessment:', error);
      setIsSubmittingAssessment(false);
      toast.error('Error', {
        description: 'There was an issue calculating your rating. Using default assessment.',
      });
      proceedToNext();
    }
  };

  const completePadelAssessment = async (finalResponses: PadelQuestionnaireResponse) => {
    setLoadingMessage('Calculating your padel rating...');
    setIsSubmittingAssessment(true);
    try {
      // Calculate rating using existing logic
      const ratingResult = padelQuestionnaire.calculateInitialRating(finalResponses);
      
      const skillData = {
        responses: finalResponses,
        rating: ratingResult,
        feedback: padelQuestionnaire.generateFeedback(ratingResult)
      };
      
      const updatedSkillLevels = {
        ...data.skillAssessments,
        [sport as SportType]: JSON.stringify(skillData)
      };
      await updateData({ skillAssessments: updatedSkillLevels });

      // Save to backend
      try {
        await saveToBackend('padel', finalResponses);
      } catch (backendError) {
        console.warn('Failed to save to backend, but proceeding with local data:', backendError);
      }
      
      // Navigate directly to results without delay
      router.replace(`/onboarding/assessment-results?sport=${sport}&sportIndex=${currentSportIndex}`);
    } catch (error) {
      console.error('Error in completePadelAssessment:', error);
      setIsSubmittingAssessment(false);
      toast.error('Error', {
        description: 'There was an issue calculating your rating. Using default assessment.',
      });
      proceedToNext();
    }
  };

  // Helper function to save responses to backend
  const saveToBackend = async (sportName: string, responses: any) => {
    try {
      if (!session.data?.user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { questionnaireAdapter } = await import('../services/adapter');
      await questionnaireAdapter.saveQuestionnaireResponse(sportName, responses, session.data.user.id);
      console.log(`Successfully saved ${sportName} responses to backend`);
    } catch (error) {
      console.error(`Failed to save ${sportName} responses to backend:`, error);
      throw error;
    }
  };


  const proceedToNext = () => {
    // Check if there are more sports to assess
    if (currentSportIndex < selectedSports.length - 1) {
      // Navigate to skill assessment for next sport
      const nextSport = selectedSports[currentSportIndex + 1];
      router.push(`/onboarding/skill-assessment?sport=${nextSport}&sportIndex=${currentSportIndex + 1}`);
    } else {
      // All sports assessed, go to profile picture
      router.push('/onboarding/profile-picture');
    }
  };

  const handleBack = () => {
    if (isComprehensiveQuestionnaire) {
      // Go back to previous question page within the questionnaire
      if (currentPageIndex > 0) {
        const previousPage = questionHistory[currentPageIndex - 1];
        setQuestions(previousPage.questions);
        setResponses(previousPage.responses);
        setCurrentPageIndex(currentPageIndex - 1);
        setCurrentPageAnswers({});
        // Navigation is handled within question cards
        setSkillResponses({});
        setTextInput('');
        console.log('📖 Going back to previous question page:', currentPageIndex - 1);
      } else {
        // At first question page, go back to previous sport or game select
        if (currentSportIndex > 0) {
          const previousSport = selectedSports[currentSportIndex - 1];
          router.push(`/onboarding/skill-assessment?sport=${previousSport}&sportIndex=${currentSportIndex - 1}`);
        } else {
          router.push('/onboarding/game-select');
        }
      }
    } else {
      // For simple dropdown, go back to previous sport or game select
      if (currentSportIndex > 0) {
        const previousSport = selectedSports[currentSportIndex - 1];
        router.push(`/onboarding/skill-assessment?sport=${previousSport}&sportIndex=${currentSportIndex - 1}`);
      } else {
        router.push('/onboarding/game-select');
      }
    }
  };

  const handleNext = async () => {
    if (isComprehensiveQuestionnaire) {
      // Include skill responses for skill matrix questions
      const currentQuestion = questions[currentQuestionIndex];
      let finalPageAnswers = { ...currentPageAnswers };
      
      if (currentQuestion?.type === 'skill_matrix' && Object.keys(skillResponses).length > 0) {
        finalPageAnswers[currentQuestion.key] = skillResponses;
      }
      
      const newResponses = { ...responses, ...finalPageAnswers };
      setResponses(newResponses);
      
      // Get the appropriate questionnaire
      const questionnaire = currentQuestionnaireType === 'pickleball' ? pickleballQuestionnaire : 
                           currentQuestionnaireType === 'tennis' ? tennisQuestionnaire : padelQuestionnaire;
      
      // Get next questions based on updated responses
      const nextQuestions = questionnaire.getConditionalQuestions(newResponses);
      
      // Clear current page answers and navigation
      setCurrentPageAnswers({});
      setSkillResponses({});
      setTextInput('');
      
      // Check if questionnaire is complete
      if (nextQuestions.length === 0) {
        // Questionnaire complete, calculate rating
        console.log('🎯 Questionnaire complete, calculating rating...');
        if (currentQuestionnaireType === 'pickleball') {
          await completePickleballAssessment(newResponses as QuestionnaireResponse);
        } else if (currentQuestionnaireType === 'tennis') {
          await completeTennisAssessment(newResponses as TennisQuestionnaireResponse);
        } else {
          await completePadelAssessment(newResponses as PadelQuestionnaireResponse);
        }
        return;
      }
      
      // Update questions and reset to first question of new set
      setQuestions(nextQuestions);
      setCurrentQuestionIndex(0);
      setCurrentPageIndex(currentPageIndex + 1);
      console.log('📖 Moving to next question set:', nextQuestions.length, 'questions');
    } else {
      // For simple dropdown
      if (selectedOption) {
        setLoadingMessage('Saving your skill level...');
        setIsSubmittingAssessment(true);
        try {
          const updatedSkillLevels = {
            ...data.skillAssessments,
            [sport as SportType]: selectedOption
          };
          await updateData({ skillAssessments: updatedSkillLevels });

          // Save simple skill level to backend
          try {
            await saveToBackend(sport as string, { skill_level: selectedOption });
          } catch (backendError) {
            console.warn('Failed to save skill level to backend:', backendError);
          }

          proceedToNext();
        } catch (error) {
          console.error('Error saving simple skill level:', error);
          setIsSubmittingAssessment(false);
          proceedToNext(); // Proceed anyway
        }
      }
    }
  };

  const startFreshAssessment = () => {
    console.log('🔍 Starting fresh assessment...');
    
    try {
      // Reset all questionnaire state for a fresh start
      const emptyResponses = {};
      setResponses(emptyResponses);
      setSkillResponses({});
      setCurrentQuestionIndex(0);
      setTextInput('');
      
      console.log('✅ State reset complete');
      
      // Skip updating skill levels for now to avoid context issues
      console.log('⏭️ Skipping skill levels update');
      
      // Get the appropriate questionnaire
      const questionnaire = currentQuestionnaireType === 'pickleball' ? pickleballQuestionnaire : 
                           currentQuestionnaireType === 'tennis' ? tennisQuestionnaire : padelQuestionnaire;
      
      // Get questions from questionnaire service
      const initialQuestions = questionnaire.getConditionalQuestions(emptyResponses);
      console.log('📋 Questions from service:', initialQuestions.length, initialQuestions);
      
      if (initialQuestions.length > 0) {
        setQuestions(initialQuestions);
        console.log('✅ Service questions set');
      } else {
        // Fallback question based on sport
        if (currentQuestionnaireType === 'pickleball') {
          const hasDoprQuestion = {
            key: 'has_dupr',
            question: 'Do you have a DUPR (Dynamic Universal Pickleball Rating)?',
            type: 'single_choice' as const,
            options: ['Yes', 'No', 'Not sure what DUPR is'],
            help_text: 'DUPR is the official rating system used in competitive pickleball',
          };
          setQuestions([hasDoprQuestion]);
        } else if (currentQuestionnaireType === 'tennis') {
          const experienceQuestion = {
            key: 'experience',
            question: 'How long have you been playing tennis?',
            type: 'single_choice' as const,
            options: ['Less than 6 months', '6 months - 1 year', '1-2 years', '2-5 years', 'More than 5 years'],
            help_text: 'Include all tennis experience, whether casual or formal',
          };
          setQuestions([experienceQuestion]);
        } else {
          const experienceQuestion = {
            key: 'experience',
            question: 'How long have you been playing padel?',
            type: 'single_choice' as const,
            options: ['Less than 3 months', '3-6 months', '6 months - 1 year', '1-2 years', 'More than 2 years'],
            help_text: 'Include all padel experience, whether casual or formal',
          };
          setQuestions([experienceQuestion]);
        }
        console.log('✅ Fallback question set');
      }
      
      // Hide introduction and force questionnaire to show
      setShowIntroduction(false);
      setForceShowQuestionnaire(true);
      console.log('✅ Introduction hidden - should now show questionnaire');
      
    } catch (error) {
      console.error('❌ Error in startFreshAssessment:', error);
    }
  };

  const skipAssessmentForLater = async () => {
    setLoadingMessage('Saving preferences...');
    setIsSubmittingAssessment(true);
    try {
      // Set a placeholder value to indicate they'll answer later
      const updatedSkillLevels = {
        ...data.skillAssessments,
        [sport as SportType]: 'answer_later'
      };
      await updateData({ skillAssessments: updatedSkillLevels });
      
      // Show toast notification
      toast.success('Assessment Skipped', {
        description: 'You can complete your skill assessment later in your profile settings.',
      });
      
      proceedToNext();
    } catch (error) {
      console.error('Error skipping assessment:', error);
      setIsSubmittingAssessment(false);
      proceedToNext(); // Proceed anyway
    }
  };

  const renderIntroduction = () => {
    const sportName = currentQuestionnaireType === 'pickleball' ? 'pickleball' : 
                     currentQuestionnaireType === 'tennis' ? 'tennis' : 'padel';
    const ratingSystem = currentQuestionnaireType === 'pickleball' ? 'DUPR rating integration for existing players' : 
                        currentQuestionnaireType === 'tennis' ? 'Standard tennis rating assessment' : 
                        'Padel-specific rating for doubles play';
    
    // Extract first name from full name
    const firstName = data.fullName ? data.fullName.split(' ')[0] : 'there';
    
    return (
      <>
        {/* Pickleball branding */}
        <View style={styles.pickleballBranding}>
          <View style={styles.pickleballIconContainer}>
            <PickleballIcon />
          </View>
          <Text style={styles.pickleballText}>pickleball</Text>
        </View>
        
        {/* Introduction container */}
        <View style={styles.introductionContainer}>
          <View style={styles.whiteCard}>
            {/* Greeting at top-left of white card */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>Hi, {firstName}</Text>
            </View>
            <Text style={styles.introTitle}>It&apos;s time to set your level.</Text>
            <View style={styles.introPoints}>
              <View style={styles.introPointContainer}>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <Text style={styles.introPoint}>5 mins or less</Text>
              </View>
              <View style={styles.introPointContainer}>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <Text style={styles.introPoint}>About your play style & experience</Text>
              </View>
              <View style={styles.introPointContainer}>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <Text style={styles.introPoint}>Already have a DUPR rating? We&apos;ll sync it</Text>
              </View>
              <View style={styles.introPointContainer}>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <Text style={styles.introPoint}>Not sure? Skip and come back later</Text>
              </View>
            </View>
            <Text style={styles.introDescription}>
              You&apos;ll start with a provisional DMR based on your experience and skill level to match you with the most balanced competition in the right division.
            </Text>
            <View style={styles.introButtonContainer}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={startFreshAssessment}
              >
                <Text style={styles.startButtonText}>Start Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.answerLaterButton}
                onPress={skipAssessmentForLater}
              >
                <Text style={styles.answerLaterButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </>
    );
  };


  // Calculate total questions and current progress
  const getQuestionProgress = () => {
    if (!isComprehensiveQuestionnaire || !currentQuestionnaireType) {
      return { current: currentQuestionIndex + 1, total: questions.length };
    }
    
    const questionnaire = currentQuestionnaireType === 'pickleball' ? pickleballQuestionnaire : 
                         currentQuestionnaireType === 'tennis' ? tennisQuestionnaire : padelQuestionnaire;
    
    // Count answered questions
    const allResponses = { ...responses, ...currentPageAnswers };
    let answeredQuestions = 0;
    
    // Count questions that have been answered
    for (const [key, value] of Object.entries(allResponses)) {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && value !== null) {
          // For skill matrix, count each sub-question
          answeredQuestions += Object.keys(value).length;
        } else {
          answeredQuestions += 1;
        }
      }
    }
    
    // Calculate total questions by simulating the flow
    let totalQuestions = answeredQuestions;
    let currentResponses = { ...allResponses };
    
    // Simulate remaining questions
    while (true) {
      const nextQuestions = questionnaire.getConditionalQuestions(currentResponses);
      if (nextQuestions.length === 0) break;
      
      totalQuestions += nextQuestions.length;
      
      // Simulate answering all questions in this set
      for (const question of nextQuestions) {
        if (question.type === 'single_choice') {
          currentResponses[question.key] = question.options?.[0] || '';
        } else if (question.type === 'number') {
          currentResponses[question.key] = question.min_value || 0;
        } else if (question.type === 'skill_matrix' && question.sub_questions) {
          const skillResponses: { [key: string]: string } = {};
          for (const [skillKey, skillData] of Object.entries(question.sub_questions)) {
            const skill = skillData as { question: string; options: string[] };
            skillResponses[skillKey] = skill.options[0] || '';
          }
          currentResponses[question.key] = skillResponses;
        }
      }
    }
    
    return { current: answeredQuestions + 1, total: totalQuestions };
  };

  const getQuestionContext = (question: Question | TennisQuestion | PadelQuestion) => {
    // First check if the question has its own context data
    if ('contextText' in question && question.contextText) {
      return {
        text: question.contextText,
        tooltip: 'tooltipText' in question ? question.tooltipText : undefined
      };
    }
    
    // Fall back to predefined context map for pickleball questions
    const pickleballContextMap: { [key: string]: { text: string; tooltip?: string } } = {
      has_dupr: { 
        text: "We will take into account of your existing DUPR (if any) in calculating a provisional DMR for you.",
        tooltip: "DUPR is the official rating system used in competitive pickleball"
      },
      dupr_singles: { 
        text: "Your official singles rating for accurate assessment",
        tooltip: "DUPR ratings typically range from 2.0 (beginner) to 8.0+ (professional)"
      },
      dupr_doubles: { 
        text: "Your official doubles rating for accurate assessment",
        tooltip: "Doubles ratings may differ from singles due to partner play dynamics"
      },
      dupr_reliability_games: { 
        text: "More games means a more reliable rating",
        tooltip: "DUPR becomes more accurate with 15+ rated games"
      },
      dupr_recent_activity: { 
        text: "Recent play ensures current skill level",
        tooltip: "Skills can change over time, recent games reflect current ability"
      },
      dupr_competition_level: { 
        text: "Competition level affects rating accuracy",
        tooltip: "Tournament games typically provide more accurate ratings"
      },
      experience: { 
        text: "Experience level helps gauge your development",
        tooltip: "Playing time correlates with skill development patterns"
      },
      sports_background: { 
        text: "Other sports experience translates to pickleball",
        tooltip: "Tennis, badminton, and paddle sports provide transferable skills"
      },
      frequency: { 
        text: "How often you play affects skill development",
        tooltip: "Regular play accelerates improvement and maintains consistency"
      },
      competitive_level: { 
        text: "Your typical competition level",
        tooltip: "The skill level of your regular opponents indicates your own level"
      },
      skills: { 
        text: "Technical skills assessment",
        tooltip: "Different aspects of your game may be at different skill levels"
      },
      self_rating: { 
        text: "Your honest self-assessment",
        tooltip: "Self-perception helps validate our calculated rating"
      },
      tournament: { 
        text: "Tournament experience indicates skill level",
        tooltip: "Competitive play demonstrates ability under pressure"
      },
      consistency_check_1: { 
        text: "Overall ability check",
        tooltip: "Helps us verify the consistency of your responses"
      },
      consistency_check_2: { 
        text: "Competition level verification",
        tooltip: "Cross-validates your skill level assessment"
      },
      coaching_background: {
        text: "Formal instruction background",
        tooltip: "Coaching experience often indicates higher skill levels"
      }
    };
    
    return pickleballContextMap[question.key];
  };

  const renderQuestionnaireQuestion = (question: Question | TennisQuestion | PadelQuestion) => {
    const contextData = getQuestionContext(question);
    
    // Determine if Next button should be enabled
    const isNextEnabled = () => {
      if (question.type === 'skill_matrix' && question.sub_questions) {
        // For skill matrix, check if all sub-questions are answered
        const allSkillKeys = Object.keys(question.sub_questions);
        const answeredSkillKeys = Object.keys(skillResponses);
        return allSkillKeys.every(key => answeredSkillKeys.includes(key));
      } else if (question.type === 'number') {
        // For number input, check if there's a valid input or if it's optional
        return currentPageAnswers[question.key] !== undefined || question.optional;
      } else {
        // For single choice, check if an option is selected
        return currentPageAnswers[question.key] !== undefined;
      }
    };
    
    const navigationButtons = (
      <>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={skipAssessmentForLater}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            !isNextEnabled() && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!isNextEnabled()}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </>
    );
    
    switch (question.type) {
      case 'single_choice':
        return (
          <QuestionContainer
            question={question.question}
            helpText={question.help_text}
            contextText={contextData?.text}
            tooltipText={contextData?.tooltip}
            navigationButtons={navigationButtons}
          >
            {question.options?.map((option, index) => (
              <OptionButton
                key={index}
                title={option}
                isSelected={currentPageAnswers[question.key] === option || responses[question.key] === option}
                onPress={() => handleQuestionnaireResponse(question.key, option)}
              />
            ))}
          </QuestionContainer>
        );
      
      case 'number':
        return (
          <QuestionContainer
            question={question.question}
            helpText={question.help_text}
            contextText={contextData?.text}
            tooltipText={contextData?.tooltip}
            navigationButtons={navigationButtons}
          >
            <NumberInput
              value={currentPageAnswers[question.key] ? String(currentPageAnswers[question.key]) : textInput}
              onChangeText={setTextInput}
              onSubmit={() => {
                const numValue = parseFloat(textInput);
                if (!isNaN(numValue) && 
                    (!question.min_value || numValue >= question.min_value) &&
                    (!question.max_value || numValue <= question.max_value)) {
                  handleQuestionnaireResponse(question.key, numValue);
                } else {
                  toast.error('Invalid Input', {
                    description: `Please enter a valid number ${question.min_value ? `between ${question.min_value} and ${question.max_value}` : ''}`,
                  });
                }
              }}
              onSkip={question.optional ? () => handleQuestionnaireResponse(question.key, '') : undefined}
              minValue={question.min_value}
              maxValue={question.max_value}
              allowSkip={question.optional}
            />
          </QuestionContainer>
        );
      
      case 'skill_matrix':
        return (
          <QuestionContainer
            question={question.question}
            helpText={question.help_text}
            contextText={contextData?.text}
            tooltipText={contextData?.tooltip}
            navigationButtons={navigationButtons}
          >
            {question.sub_questions && Object.entries(question.sub_questions).map(([skillKey, skillData]) => {
              const skill = skillData as { question: string; options: string[]; tooltip?: string };
              return (
                <View key={skillKey} style={styles.skillQuestionContainer}>
                  <View style={styles.skillQuestionHeader}>
                    <Text style={styles.skillQuestionText}>{skill.question}</Text>
                    {skill.tooltip && (
                      <TouchableOpacity 
                        style={styles.skillTooltipButton} 
                        onPress={() => toast.info('Info', {
                          description: skill.tooltip,
                        })}
                      >
                        <Text style={styles.skillTooltipIcon}>ⓘ</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.skillOptionsContainer}>
                    {skill.options.map((option, index) => (
                      <OptionButton
                        key={index}
                        title={option}
                        isSelected={skillResponses[skillKey] === option}
                        onPress={() => handleSkillResponse(skillKey, option)}
                        variant="compact"
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </QuestionContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGradient sport={sport as string} />
      <View style={styles.contentContainer}>
        

        {/* Render different content based on sport type */}
        {isComprehensiveQuestionnaire ? (
          showIntroduction && !forceShowQuestionnaire ? (
            renderIntroduction()
          ) : (
            <>
              {/* Questionnaire Header */}
              <View style={styles.questionnaireHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M15 18L9 12L15 6"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
                
                <Text style={styles.questionnaireTitle}>
                  {currentQuestionnaireType === 'pickleball' ? 'pickleball' : 
                   currentQuestionnaireType === 'tennis' ? 'tennis' : 'padel'}
                </Text>
                
                <View style={styles.headerSpacer} />
              </View>

              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                {(() => {
                  const progress = getQuestionProgress();
                  return (
                    <>
                      <Text style={styles.progressText}>
                        Question {progress.current}/{progress.total}
                      </Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${(progress.current / progress.total) * 100}%` }
                          ]} 
                        />
                      </View>
                    </>
                  );
                })()}
              </View>

              {/* Question Content */}
              <View style={styles.questionnaireContainer}>
                {questions.length > 0 && currentQuestionIndex < questions.length ? (
                  <View style={styles.questionContainer}>
                    {renderQuestionnaireQuestion(questions[currentQuestionIndex])}
                  </View>
                ) : questions.length === 0 ? (
                  <View style={styles.questionContainer}>
                    <Text style={styles.loadingText}>Loading questions...</Text>
                  </View>
                ) : (
                  <View style={styles.questionContainer}>
                    <Text style={styles.loadingText}>Preparing assessment...</Text>
                  </View>
                )}
              </View>
            </>
          )
        ) : (
          <QuestionContainer
            question="How long have you been playing?"
          >
            <TouchableOpacity
              ref={dropdownRef}
              style={styles.dropdown}
              onPress={openDropdown}
            >
              <Text style={[
                styles.dropdownText,
                selectedOption && styles.dropdownTextSelected
              ]}>
                {selectedOption || 'Select an option'}
              </Text>
              <ChevronDown />
            </TouchableOpacity>
          </QuestionContainer>
        )}

      </View>
      

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        >
          <View 
            style={[
              styles.modalDropdown,
              {
                top: dropdownPosition.y,
                left: dropdownPosition.x,
                width: dropdownPosition.width,
              }
            ]}
          >
            <FlatList
              data={skillOptions}
              keyExtractor={(item, index) => `${item}-${index}`}
              style={styles.modalDropdownList}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    index === skillOptions.length - 1 && styles.dropdownItemLast,
                  ]}
                  onPress={() => selectOption(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Loading Overlay */}
      {isSubmittingAssessment && (
        <LoadingSpinner
          overlay={true}
          showCard={true}
          message={loadingMessage}
          color="#FE9F4D"
          size="large"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 71,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#FE9F4D',
  },
  headerContainer: {
    paddingHorizontal: 37,
    marginBottom: 20,
  },
  sportIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sportTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 40,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  questionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dropdown: {
    height: 46,
    borderWidth: 1,
    borderColor: '#EDF1F3',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    shadowColor: '#E4E5E7',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.24,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  dropdownText: {
    fontSize: 14,
    color: '#6C7278',
    fontWeight: '500',
  },
  dropdownTextSelected: {
    color: '#1A1C1E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalDropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF1F3',
    borderRadius: 10,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalDropdownList: {
    maxHeight: 250,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F3',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1A1C1E',
    fontWeight: '500',
  },
  questionsContainer: {
    paddingHorizontal: 37,
  },
  questionnaireContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  questionnaireHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionnaireTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#CA9BFF',
    fontFamily: 'Poppins',
    textTransform: 'lowercase',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 36,
    paddingBottom: 20,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'left',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE9F4D',
    borderRadius: 4,
  },
  questionnaireNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#FE9F4D',
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  nextButton: {
    backgroundColor: '#FE9F4D',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 100,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  skillQuestionContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F3',
  },
  skillQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Roboto',
    flex: 1,
  },
  skillOptionsContainer: {
    gap: 8,
  },
  skillQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skillTooltipButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FE9F4D',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  skillTooltipIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  button: {
    height: 40,
    backgroundColor: '#FE9F4D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTennis: {
    backgroundColor: '#374F35',
    borderWidth: 1,
    borderColor: '#5D825A',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
  },
  // New UX Enhancement Styles
  greetingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A04DFE',
    fontFamily: 'Poppins',
  },
  pickleballBranding: {
    position: 'absolute',
    right: 20,
    bottom: 610,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  pickleballIconContainer: {
    marginBottom: 8,
  },
  pickleballText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#CA9BFF',
    fontFamily: 'Poppins',
    textAlign: 'right',
  },
  introductionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 20,
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  introTitle: {
    fontSize: 30,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 24,
    fontFamily: 'Inter',
    textAlign: 'left',
  },
  introPoints: {
    marginBottom: 20,
  },
  introPointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(160, 77, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  arrowText: {
    fontSize: 17,
    color: '#A04DFE',
    fontWeight: '600',
  },
  introDescription: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 21,
    marginBottom: 2,
    fontFamily: 'Poppins',
  },
  introPoint: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8C8C8C',
    lineHeight: 21,
    fontFamily: 'Roboto',
    flex: 1,
  },
  introButtonContainer: {
    gap: 14,
    marginTop: 28,
  },
  startButton: {
    height: 50,
    backgroundColor: '#A04DFE',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A04DFE',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  answerLaterButton: {
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#A04DFE',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerLaterButtonText: {
    color: '#777777',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C7278',
    fontFamily: 'Roboto',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontFamily: 'Roboto',
    textAlign: 'center',
    marginTop: 20,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 37,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingTop: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#EDF1F3',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  navigationButton: {
    height: 40,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  backButtonText: {
    color: '#6C7278',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
});

export default SkillAssessmentScreen;