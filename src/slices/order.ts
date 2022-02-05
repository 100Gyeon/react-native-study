import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface Order {
  orderId: string;
  start: {
    latitude: number;
    longitude: number;
  };
  end: {
    latitude: number;
    longitude: number;
  };
  price: number;
}

interface InitialState {
  orders: Order[];
  deliveries: Order[];
}

const initialState: InitialState = {
  orders: [], // 서버로부터 오는 주문들 저장
  deliveries: [], // (orders 배열의 주문들 중) 수락해서 실제로 배달하게 되는 주문
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    // 주문 저장
    addOrder(state, action: PayloadAction<Order>) {
      state.orders.push(action.payload);
    },
    // 주문 배달 수락
    acceptOrder(state, action: PayloadAction<string>) {
      const index = state.orders.findIndex(v => v.orderId === action.payload);
      if (index > -1) {
        // deliveries에 추가하고, orders에서 빼는 작업
        state.deliveries.push(state.orders[index]);
        state.orders.splice(index, 1);
      }
    },
    // 주문 배달 거절
    rejectOrder(state, action: PayloadAction<string>) {
      const index = state.orders.findIndex(v => v.orderId === action.payload);
      if (index > -1) {
        state.orders.splice(index, 1);
      }
      const delivery = state.deliveries.findIndex(
        v => v.orderId === action.payload,
      );
      if (delivery > -1) {
        state.deliveries.splice(delivery, 1);
      }
    },
  },
  extraReducers: builder => {},
});

export default orderSlice;