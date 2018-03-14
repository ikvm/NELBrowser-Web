// import * as $ from "jquery";
/// <reference path ="Util.ts"/>
namespace WebBrowser
{
    /**
     * @class 交易记录
     */
    export class Trasctions
    {
        private ajax: Ajax = new Ajax();
        private pageUtil: PageUtil;
        private txlist: JQuery<HTMLElement>;
        constructor()
        {
            
            this.txlist = $("#txlist-page");
            this.start();
            //监听交易列表选择框
            $("#TxType").change(() =>
            {
                this.updateTrasctions(this.pageUtil, <string>$("#TxType").val());
            });

            this.txlist.find("#next").click(() =>
            {
                if (this.pageUtil.currentPage == this.pageUtil.totalPage)
                {
                    alert('当前页已经是最后一页了');
                    return;
                } else
                {
                    this.pageUtil.currentPage += 1;
                    this.updateTrasctions(this.pageUtil, <string>$("#TxType").val());
                }
            });
            this.txlist.find("#previous").click(() =>
            {
                if (this.pageUtil.currentPage <= 1)
                {
                    alert('当前已经是第一页了');
                    return;
                } else
                {
                    this.pageUtil.currentPage -= 1;
                    this.updateTrasctions(this.pageUtil, <string>$("#TxType").val());
                }
            });

        }

        //更新交易记录
        public async updateTrasctions(pageUtil: PageUtil, txType: string)
        {
            //分页查询交易记录
            let txs: Tx[] = await this.ajax.post('getrawtransactions', [pageUtil.pageSize, pageUtil.currentPage, txType]);
            this.txlist.find("table").children("tbody").empty();
            txs.forEach((tx) =>
            {
                let txid = tx.txid;
                txid = txid.replace('0x', '');
                txid = txid.substring(0, 6) + '...' + txid.substring(txid.length - 6);
                let html: string = "";
                html += "<tr>"
                html += "<td><a class='code' target='_blank' rel='external nofollow' href='./#" + locationtool.getNetWork()+"/transaction/" + tx.txid + "'>" + txid
                html += "</a></td>"
                html += "<td><a href='./#" + locationtool.getNetWork()+"/block/" + tx.blockindex + "'>" + tx.blockindex
                html += "</a></td>"
                html += "<td>" + tx.type.replace("Transaction", "");
                html += "</td>"
                html += "<td>" + (tx.gas == undefined ? '0' : tx.gas)
                html += "</td>"
                html += "<td>" + tx.size + " bytes"
                html += "</td>"
                html += "</tr>"
                this.txlist.find("table").children("tbody").append(html);
            });
            pageCut(this.pageUtil);
        }
        /**
         * async start
         */
        public async start()
        {
            let txCount = await this.ajax.post('gettxcount', []);
            txCount = txCount[0]['txcount'];
            //初始化交易列表
            this.pageUtil = new PageUtil(txCount, 15);
            this.updateTrasctions(this.pageUtil, <string>$("#TxType").val());
        }
    }

    /**
     * @class 交易详情
     */
    export class TrasctionInfo
    {
        private ajax: Ajax = new Ajax();
        constructor() {  }
        public async updateTxInfo(txid: string)
        {
            let txInfos: Tx[] = await this.ajax.post('getrawtransaction', [txid]);
            let txInfo: Tx = txInfos[0];
            $("#type").text(txInfo.type.replace("Transaction", ""));
            $("#txInfo").text("Hash: " + txInfo.txid);
            $("#index").text(txInfo.blockindex);
            $("#size").text(txInfo.size + " bytes");

            let allAsset: Asset[] = await this.ajax.post('getallasset', []);
            allAsset.map((asset) =>
            {
                if (asset.id == AssetEnum.NEO)
                {
                    asset.name = [{ lang: 'en', name: 'NEO' }];
                }
                if (asset.id == AssetEnum.GAS)
                {
                    asset.name = [{ lang: 'en', name: "GAS" }];
                }
            });


            let arr = new Array<any>();
            for (let index = 0; index < txInfo.vin.length; index++)
            {
                const vin = txInfo.vin[index];
                try
                {
                    let txInfos: Tx[] = await this.ajax.post('getrawtransaction', [vin.txid]);
                    let vout = txInfos[0].vout[vin.vout]
                    let address: string = vout.address;
                    let value: string = vout.value;
                    let name = allAsset.find(val => val.id == vout.asset).name.map(name => { return name.name }).join("|");
                    arr.push({ vin: vin.txid, vout: vin.vout, addr: address, name: name, amount: value });
                } catch (error)
                {

                }
            }
            let array = this.groupByaddr(arr);
            for (let index = 0; index < array.length; index++)
            {
                const item = array[index];
                let html = "";

                html += '<div class="line" > <div class="title-nel" > <span>Address </span></div >';
                html += '<div class="content-nel" > <span id="size" >' + item.addr + ' </span></div > </div>';
                for (let i = 0; i < item.data.length; i++)
                {
                    const element = item.data[i];
                    html += '<div class="line" > <div class="title-nel" > <span>' + element.name + ' </span></div >';
                    html += '<div class="content-nel" > <span id="size" >' + element.amount + ' </span></div > </div>';
                }
                $("#from").append(html);
            }
            
            txInfo.vout.forEach(vout =>
            {
                let name = allAsset.find(val => val.id == vout.asset).name.map(name => name.name).join("|");
                let sign: string = "";
                if (array.find(item => item.addr == vout.address))
                {
                    sign = "(change)"
                }
                let html = "";
                html += '<div class="line" > <div class="title-nel" > <span>Address </span></div >';
                html += '<div class="content-nel" > <span id="size" >' + vout.address + ' </span></div > </div>';
                html += '<div class="line" > <div class="title-nel" > <span>' + name+' </span></div >';
                html += '<div class="content-nel" > <span id="size" >' + vout.value + sign + ' </span></div > </div>';
                $("#to").append(html);
            });
        }

        public groupByaddr(arr: any[])
        {
            var map = {},
                dest = [];
            for (var i = 0; i < arr.length; i++)
            {
                var ai = arr[i];
                if (!map[ai.addr])
                {
                    dest.push({
                        addr: ai.addr,
                        data: [ai]
                    });
                    map[ai.addr] = ai;
                } else
                {
                    for (var j = 0; j < dest.length; j++)
                    {
                        var dj = dest[j];
                        if (dj.addr == ai.addr)
                        {
                            dj.data.push(ai);
                            break;
                        }
                    }
                }
            }
            return dest;
        }

    }

}
