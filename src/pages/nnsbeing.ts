﻿namespace WebBrowser
{
    //地址列表
    export class NNSAuction implements Page
    {
        div: HTMLDivElement = document.getElementById('nnsbeing-page') as HTMLDivElement;
        footer: HTMLDivElement = document.getElementById('footer-box') as HTMLDivElement;
        close(): void
        {
            this.div.hidden = true;
            this.footer.hidden = true;
        }
        private pageUtil: PageUtil;
        private sorttype: string;
        constructor() {
            $("#sortlist-type").change(() => {
                this.sorttype = $("#sortlist-type option:selected").val() as string;
                this.domainListInit(true, this.sorttype);
            }) 
        }
        /**
         * addrlistInit
         */
        public async domainListInit(first: boolean,sorttype:string)
        {
            $("#domainBeingListPage").empty();
            let domain: DomainBiding;
            if (!first) {     //判断是否为初始加载               
                if (sorttype === 'Time') {
                    domain = await WWW.apiaggr_getauctingdomain(this.pageUtil.currentPage, this.pageUtil.pageSize) as DomainBiding;
                } else if (sorttype === 'Price') {
                    domain = await WWW.apiaggr_getauctingdomainbymaxprice(this.pageUtil.currentPage, this.pageUtil.pageSize) as DomainBiding;
                }                               
            } else {    //初始加载
                if (sorttype === 'Time') {
                    domain = await WWW.apiaggr_getauctingdomain(1, 15) as DomainBiding; 
                } else if (sorttype === 'Price') {
                    domain = await WWW.apiaggr_getauctingdomainbymaxprice(1, 15) as DomainBiding; 
                }                  
                if (domain) {
                    this.pageUtil = new PageUtil(domain[0].count, 15);
                }
            }

            if (domain) {
                this.loadView(domain[0].list);
                $("#nnsbeing-wrap").show();
                //let minNum = this.pageUtil.currentPage * this.pageUtil.pageSize - this.pageUtil.pageSize;
                //let maxNum = this.pageUtil.totalCount;
                //let diffNum = maxNum - minNum;
                //if (diffNum > 15) {
                //    maxNum = this.pageUtil.currentPage * this.pageUtil.pageSize;
                //}
                //let pageMsg = "Live auctions " + (minNum + 1) + " to " + maxNum + " of " + this.pageUtil.totalCount;
                let pageMsg = "Page " + this.pageUtil.currentPage + " , " + this.pageUtil.totalPage + " pages in total";
                if (location.pathname == '/zh/') {
                    pageMsg = "第 " + this.pageUtil.currentPage + " 页，共 " + this.pageUtil.totalPage + " 页"
                }
                $("#nnsbeing-page").find("#nnsbeing-page-msg").html(pageMsg);
                if (this.pageUtil.totalPage - this.pageUtil.currentPage) {
                    $("#nnsbeing-page-next").removeClass('disabled');
                } else {
                    $("#nnsbeing-page-next").addClass('disabled');
                }
                if (this.pageUtil.currentPage - 1) {
                    $("#nnsbeing-page-previous").removeClass('disabled');
                } else {
                    $("#nnsbeing-page-previous").addClass('disabled');
                }
            } else {
                let msg = "There is no data";
                if (location.pathname == '/zh/') {
                    msg = '没有数据';
                }
                let html = `
                        <tr>
                        <td colspan="6">`+ msg + `</td>
                        </tr>`;
                $('#domainBeingListPage').append(html);
                $("#nnsbeing-wrap").hide();
            }
        }
        /**
         * start
         */
        public async start()
        {

            this.sorttype = $("#sort-type option:selected").val() as string;
            $("#sort-type").val(this.sorttype);
            $("#sortlist-type").val(this.sorttype);
            await this.domainListInit(true, this.sorttype);
            
            $("#nnsbeing-page-next").off("click").click(() => {
                if (this.pageUtil.currentPage == this.pageUtil.totalPage) {
                    this.pageUtil.currentPage = this.pageUtil.totalPage;
                } else {
                    this.pageUtil.currentPage += 1;
                    this.domainListInit(false, this.sorttype);
                }
            });
            $("#nnsbeing-page-previous").off("click").click(() => {
                if (this.pageUtil.currentPage <= 1) {
                    this.pageUtil.currentPage = 1;
                } else {
                    this.pageUtil.currentPage -= 1;
                    this.domainListInit(false, this.sorttype);
                }
            });
            $("#nnsbeing-input").val('');
            $("#nnsbeing-input").off("input").on('input', () => {
                this.doGoPage(false)
            });
            $("#nnsbeing-input").off("keydown").keydown((e) => {
                if (e.keyCode == 13) {
                    this.doGoPage(true);
                }
            });
            $("#nnsbeing-gopage").off("click").click(() => {
                this.doGoPage(true)
            });
            this.div.hidden = false;
            this.footer.hidden = false;
        }
        //跳转页面
        public doGoPage(gopage: boolean) {
            let page: number = parseInt($("#nnsbeing-input").val() as string);
            if (page && page > this.pageUtil.totalPage) {
                page = this.pageUtil.totalPage;
                $("#nnsbeing-input").val(this.pageUtil.totalPage);
            } else if (page < 0) {
                page = 1;
                $("#nnsbeing-input").val(1);
            }
            if (gopage) {
                this.pageUtil.currentPage = page;
                this.domainListInit(false, this.sorttype);
                $("#nnsbeing-input").val('');
            }
        }
        /**
         * loadView
         */
        public loadView(domainlist)
        {
            domainlist.forEach((domain) =>
            {
                let href = Url.href_nns(domain.fulldomain);
                let hreftxid = Url.href_transaction(domain.lastTime.txid);
                let hrefaddr = Url.href_address(domain.maxBuyer);
                let txid = domain.lastTime.txid.substring(0, 4) + '...' + domain.lastTime.txid.substring(domain.lastTime.txid.length - 4);
                let address = '';
                if (domain.maxBuyer != '') {
                    address = domain.maxBuyer.substring(0, 4) + '...' + domain.maxBuyer.substring(domain.maxBuyer.length - 4);
                }
                let status = '';
                switch (domain.auctionState) {
                    case '0201':
                        status = "Auction period";
                        if (location.pathname == '/zh/') {
                            status = '确定期';
                        }
                        break;
                    case '0301':
                        status = "Overtime bidding";
                        if (location.pathname == '/zh/') {
                            status = '随机期';
                        }
                        break;                
                }
                let html = `
                        <tr>
                        <td> <a href="`+ href + `" target="_self">` + domain.fulldomain + `</a></td>
                        <td> <a href="`+ hreftxid + `" target="_self">` + txid + `</a></td>
                        <td>` + domain.maxPrice + ` CGAS` + `</td>
                        <td><a href="`+ hrefaddr + `" target="_self">` + address + `</a></td>
                        <td>` + status + `</td>
                        </tr>`;
                $( '#domainBeingListPage' ).append( html );
            } );
        }
    }
}