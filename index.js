import { createApp } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.47/vue.esm-browser.min.js';
const apiUrl = `https://vue3-course-api.hexschool.io`;
const path = `shangway`;

//定義規則
VeeValidate.defineRule('email', VeeValidateRules['email']);
VeeValidate.defineRule('required', VeeValidateRules['required']);

//全部加入 載入驗證
Object.keys(VeeValidateRules).forEach(rule => {
  if (rule !== 'default') {
    VeeValidate.defineRule(rule, VeeValidateRules[rule]);
  }
});
// 讀取外部的資源
VeeValidateI18n.loadLocaleFromURL('./zh_TW.json');
// Activate the locale
VeeValidate.configure({
  generateMessage: VeeValidateI18n.localize('zh_TW'),
  validateOnInput: true, // 調整為：輸入文字時，就立即進行驗證
});

const productModal = {
  //當id變動時，取得遠端資料，並呈現Modal
  props: ['id', 'addToCard', 'openModal'],
  data() {
    return {
      modal: {},
      tempProduct: {},
      qty: 1,
    };
  },
  template: `#userProductModal`,
  watch: {
    id() {
      if (this.id) {
        console.log('productModal', this.id);
        axios.get(`${apiUrl}/v2/api/${path}/product/${this.id}`)
          .then(res => {
            console.log('單一產品', res.data.product);
            this.tempProduct = res.data.product;
            this.modal.show()
          })
      }
    }
  },
  methods: {
    hide() {
      this.modal.hide();
    }
  },
  mounted() {
    this.modal = new bootstrap.Modal(this.$refs.modal);
    //監聽 DOM， 當Modal 關閉時...要做其他事情
    this.$refs.modal.addEventListener('hidden.bs.modal', (event) => {
      this.openModal('');
    })
  }
}

const app = Vue.createApp({
  data() {
    return {
      products: [],
      productId: '',
      cart: {},
      loadingItem: '', //存id
      form: {
        user: {
          name: '',
          email: '',
          tel: '',
          address: '',
        },
        message: '',

      }
    }
  },
  methods: {
    getProducts() {
      axios.get(`${apiUrl}/v2/api/${path}/products/all`)
        .then(res => {
          console.log('產品列表', res.data.products);
          this.products = res.data.products
        })
    },
    openModal(id) {
      this.productId = id;
      console.log('外層帶入 productId', id);
    },
    //新增購物車
    addToCard(product_id, qty = 1) { //當qty沒有傳入該參數時，會使用預設值
      const data = {
        product_id,
        qty,
      };
      axios.post(`${apiUrl}/v2/api/${path}/cart`, { data })
        .then(res => {
          console.log('加入購物車', res.data)
          this.$refs.productModal.hide();
          this.getCarts();
        })
    },
    //取得購物車
    getCarts() {
      axios.get(`${apiUrl}/v2/api/${path}/cart`)
        .then(res => {
          console.log('購物車', res.data);
          this.products = res.data.products
          this.cart = res.data.data
        })
      this.getProducts()
    },
    //修改購物車
    updateCartItem(item) { //購物車的id , 產品的id
      const data = {
        product_id: item.product.id,
        qty: item.qty,
      };
      this.loadingItem = item.id
      // console.log(data, item.id);
      axios.put(`${apiUrl}/v2/api/${path}/cart/${item.id}`, { data })
        .then(res => {
          console.log('更新購物車', res.data);
          this.getCarts();
          this.loadingItem = '';
        })
      this.getProducts()
    },
    deleteItem(item) { //購物車的id , 產品的id
      axios.delete(`${apiUrl}/v2/api/${path}/cart/${item.id}`)
        .then(res => {
          console.log('刪除購物車', res.data);
          this.getCarts();
        })
    },
    onSubmit() {
      console.log(`有跳出onSubmit`);
    },
    //電話認證
    isPhone(value) {
      const phoneNumber = /^(09)[0-9]{8}$/
      return phoneNumber.test(value) ? true : '需為正確的手機號碼格式'
    },
  },
  //區域註冊
  components: {
    productModal,
  },
  mounted() {
    this.getProducts();
    this.getCarts();
  }
})
// validata
app.component('VForm', VeeValidate.Form);
app.component('VField', VeeValidate.Field);
app.component('ErrorMessage', VeeValidate.ErrorMessage);

app.mount('#app')
