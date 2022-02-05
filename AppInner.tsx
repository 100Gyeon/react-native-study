import * as React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RootState} from './src/store/reducer';
import {useSelector} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import Orders from './src/pages/Orders';
import Delivery from './src/pages/Delivery';
import Settings from './src/pages/Settings';
import SignIn from './src/pages/SignIn';
import SignUp from './src/pages/SignUp';
import useSocket from './src/hooks/useSocket';
import {useEffect} from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import Config from 'react-native-config';
import axios, { AxiosError } from 'axios';
import userSlice from './src/slices/user';
import { Alert } from 'react-native';
import { useAppDispatch } from './src/store';
import orderSlice from './src/slices/order';


export type LoggedInParamList = {
  Orders: undefined;
  Delivery: undefined;
  Complete: {orderId: string};
  Settings: undefined;
};

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AppInner() {
  // Provider 내부에서만 useSelector 사용 가능
  const isLoggedIn = useSelector((state: RootState) => !!state.user.email);
  const [socket, disconnect] = useSocket();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const callback = (data: any) => {
      dispatch(orderSlice.actions.addOrder(data));
    };
    if (socket && isLoggedIn) {
      socket.emit('acceptOrder', 'hello'); // 서버한테 데이터 보냄 -> emit
      socket.on('order', callback); // 서버한테 데이터 받음 -> on
    }
    // clean up
    return () => {
      if (socket) {
        socket.off('order', callback); // 서버한테 데이터 그만 받기 (on 했던 부분)
      }
    };
  }, [isLoggedIn, socket]);

  useEffect(() => {
    if (!isLoggedIn) {
      disconnect();
    }
  }, [dispatch, isLoggedIn, disconnect]);

    // 앱 재실행 시 토큰 있으면 자동 로그인
    useEffect(() => {
      // useEffect는 async 안되니까 async 함수 하나 만들고 실행하는 방식으로 구현
      const getTokenAndRefresh = async () => {
        try {
          const token = await EncryptedStorage.getItem('refreshToken');
          if (!token) {
            return;
          }
          const response = await axios.post(
            `${Config.API_URL}/refreshToken`,
            {},
            {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          );
          dispatch(
            userSlice.actions.setUser({
              name: response.data.data.name,
              email: response.data.data.email,
              accessToken: response.data.data.accessToken,
            }),
          );
        } catch (error) {
          console.error(error);
          if ((error as AxiosError).response?.data.code === 'expired') {
            Alert.alert('알림', '다시 로그인 해주세요.');
          }
        }
      };
      getTokenAndRefresh();
    }, [dispatch]);

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <Tab.Navigator>
          <Tab.Screen
            name="Orders"
            component={Orders}
            options={{title: '오더 목록'}}
          />
          <Tab.Screen
            name="Delivery"
            component={Delivery}
            options={{headerShown: false}}
          />
          <Tab.Screen
            name="Settings"
            component={Settings}
            options={{title: '내 정보'}}
          />
        </Tab.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen
            name="SignIn"
            component={SignIn}
            options={{title: '로그인'}}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUp}
            options={{title: '회원가입'}}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default AppInner;
